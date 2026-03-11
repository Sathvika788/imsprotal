from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date

from app.core.security import get_current_user, require_manager
from app.core.config import settings
from app.db.dynamo import log_repo, attendance_repo, user_repo
from app.services.s3_service import upload_file

router = APIRouter(prefix="/logs", tags=["logs"])


class LogSubmitRequest(BaseModel):
    date: str
    content: str


class LogVerifyRequest(BaseModel):
    status: str  # 'verified' or 'rejected'
    comment: Optional[str] = None


@router.post("/submit")
async def submit_log(
    date: str = Form(...),
    content: str = Form(...),
    proof: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    """Submit daily work log (interns only)"""
    
    if current_user['role'] not in ['intern']:
        raise HTTPException(status_code=403, detail="Only interns can submit logs")
    
    # Check if log already exists for today
    existing_log = log_repo.get_log_by_intern_and_date(current_user['user_id'], date)
    if existing_log:
        raise HTTPException(status_code=400, detail="Log already submitted for this date")
    
    # Upload proof if provided
    proof_url = None
    if proof:
        try:
            file_content = await proof.read()
            proof_url = upload_file(file_content, proof.filename, proof.content_type)
        except Exception as e:
            print(f"[FILE-UPLOAD] Failed to upload proof: {e}")
            # Continue without proof if upload fails
    
    # Create log
    log = log_repo.create_log(
        intern_id=current_user['user_id'],
        date_str=date,
        content=content,
        proof_url=proof_url
    )
    
    # Auto-mark attendance
    current_hour = datetime.now().hour
    attendance_status = "present" if current_hour < settings.LOG_CUTOFF_HOUR else "late"
    
    attendance_repo.mark_attendance(
        intern_id=current_user['user_id'],
        date_str=date,
        status=attendance_status
    )
    
    # AUTO-CALCULATE STIPEND FOR CURRENT MONTH (don't crash if this fails)
    try:
        from app.services.stipend_service import calculate_stipend_for_intern
        current_month = date[:7]  # YYYY-MM format
        stipend = calculate_stipend_for_intern(current_user['user_id'], current_month)
        print(f"[AUTO-STIPEND] ✓ Updated stipend after log submission for month {current_month}")
        print(f"[AUTO-STIPEND] Total: ₹{stipend['total_amount']}")
    except Exception as e:
        # Don't fail the submission if stipend calculation fails
        print(f"[AUTO-STIPEND] ✗ Failed to update stipend (non-critical): {e}")
        import traceback
        traceback.print_exc()
    
    return {"log": log, "attendance_marked": attendance_status}


@router.get("/my-logs")
async def get_my_logs(current_user: dict = Depends(get_current_user)):
    """Get own logs"""
    logs = log_repo.get_logs_by_intern(current_user['user_id'])
    return logs


@router.get("/intern/{intern_id}")
async def get_intern_logs(
    intern_id: str,
    current_user: dict = Depends(require_manager)
):
    """Get logs for a specific intern (managers/CEO only)"""
    logs = log_repo.get_logs_by_intern(intern_id)
    
    # Get intern info
    intern = user_repo.get_user_by_id(intern_id)
    
    return {
        "intern": intern,
        "logs": logs
    }


@router.get("/date/{date}")
async def get_logs_by_date(
    date: str,
    current_user: dict = Depends(require_manager)
):
    """Get all logs for a specific date (managers/CEO only)"""
    logs = log_repo.get_logs_by_date(date)
    
    # Enrich with intern info
    enriched_logs = []
    for log in logs:
        intern = user_repo.get_user_by_id(log['intern_id'])
        enriched_logs.append({
            **log,
            'intern_name': intern['name'] if intern else 'Unknown',
            'intern_email': intern['email'] if intern else 'Unknown'
        })
    
    return enriched_logs


@router.post("/{log_id}/verify")
async def verify_log(
    log_id: str,
    request: LogVerifyRequest,
    current_user: dict = Depends(require_manager)
):
    """Verify or reject a log (managers/CEO only)"""
    
    if request.status not in ['verified', 'rejected']:
        raise HTTPException(status_code=400, detail="Status must be 'verified' or 'rejected'")
    
    # Find the log to get intern_id and date
    all_interns = user_repo.get_users_by_role('intern')
    log = None
    intern_id = None
    
    for intern in all_interns:
        logs = log_repo.get_logs_by_intern(intern['id'])
        for l in logs:
            if l['id'] == log_id:
                log = l
                intern_id = intern['id']
                break
        if log:
            break
    
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    
    success = log_repo.update_log_status(
        intern_id=intern_id,
        log_id=log_id,
        date_str=log['date'],
        status=request.status,
        verified_by=current_user['user_id'],
        comment=request.comment
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update log")
    
    # AUTO-CALCULATE STIPEND FOR CURRENT MONTH
    if request.status == 'verified':
        from app.services.stipend_service import calculate_stipend_for_intern
        
        try:
            # Get current month from the log date
            current_month = log['date'][:7]  # YYYY-MM format
            
            # Recalculate stipend
            stipend = calculate_stipend_for_intern(intern_id, current_month)
            
            print(f"[AUTO-STIPEND] ✓ Updated stipend for intern {intern_id} for month {current_month}")
            print(f"[AUTO-STIPEND] Total: ₹{stipend['total_amount']}")
        except Exception as e:
            # Don't fail the verification if stipend calculation fails
            print(f"[AUTO-STIPEND] ✗ Failed to update stipend: {e}")
            import traceback
            traceback.print_exc()
    
    return {"success": True, "message": f"Log {request.status}"}


@router.get("/{log_id}/file")
async def get_log_file(
    log_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get log file URL (managers/CEO can access all, interns only their own)"""
    
    # Find the log
    all_interns = user_repo.get_users_by_role('intern')
    log = None
    
    for intern in all_interns:
        logs = log_repo.get_logs_by_intern(intern['id'])
        for l in logs:
            if l['id'] == log_id:
                log = l
                break
        if log:
            break
    
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    
    # Check permissions
    if current_user['role'] == 'intern' and log['intern_id'] != current_user['user_id']:
        raise HTTPException(status_code=403, detail="Access forbidden")
    
    if 'proof_url' not in log:
        raise HTTPException(status_code=404, detail="No file attached")
    
    return {"url": log['proof_url'], "log": log}