from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta

from app.core.security import get_current_user, require_manager
from app.db.dynamo import leave_repo, user_repo, attendance_repo

router = APIRouter(prefix="/leaves", tags=["leaves"])


class LeaveCreateRequest(BaseModel):
    start_date: str
    end_date: str
    reason: str
    leave_type: str  # 'sick', 'casual', 'emergency'


class LeaveReviewRequest(BaseModel):
    status: str  # 'approved' or 'rejected'
    review_notes: Optional[str] = None


@router.post("/request")
async def request_leave(
    request: LeaveCreateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Request leave (interns only)"""
    
    if current_user['role'] not in ['intern']:
        raise HTTPException(status_code=403, detail="Only interns can request leaves")
    
    if request.leave_type not in ['sick', 'casual', 'emergency']:
        raise HTTPException(status_code=400, detail="Invalid leave type")
    
    # Validate dates
    try:
        start = datetime.fromisoformat(request.start_date)
        end = datetime.fromisoformat(request.end_date)
        
        if end < start:
            raise HTTPException(status_code=400, detail="End date must be after start date")
        
        if start < datetime.now().replace(hour=0, minute=0, second=0):
            raise HTTPException(status_code=400, detail="Cannot request leave for past dates")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")
    
    leave = leave_repo.create_leave_request(
        intern_id=current_user['user_id'],
        start_date=request.start_date,
        end_date=request.end_date,
        reason=request.reason,
        leave_type=request.leave_type
    )
    
    return leave


@router.get("/my-leaves")
async def get_my_leaves(current_user: dict = Depends(get_current_user)):
    """Get own leave requests"""
    leaves = leave_repo.get_leaves_by_intern(current_user['user_id'])
    return leaves


@router.get("/all")
async def get_all_leaves(current_user: dict = Depends(require_manager)):
    """Get all leave requests (managers/CEO only)"""
    leaves = leave_repo.get_all_leave_requests()
    
    # Enrich with intern info
    enriched_leaves = []
    for leave in leaves:
        intern = user_repo.get_user_by_id(leave['intern_id'])
        enriched_leaves.append({
            **leave,
            'intern_name': intern['name'] if intern else 'Unknown',
            'intern_email': intern['email'] if intern else 'Unknown'
        })
    
    return enriched_leaves


@router.post("/{leave_id}/review")
async def review_leave(
    leave_id: str,
    request: LeaveReviewRequest,
    current_user: dict = Depends(require_manager)
):
    """Approve or reject leave request (managers/CEO only)"""
    
    if request.status not in ['approved', 'rejected']:
        raise HTTPException(status_code=400, detail="Status must be 'approved' or 'rejected'")
    
    # Get leave details
    leave = leave_repo.get_leave_request(leave_id)
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    # Update leave status
    success = leave_repo.update_leave_status(
        leave_id=leave_id,
        status=request.status,
        reviewed_by=current_user['user_id'],
        review_notes=request.review_notes
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update leave")
    
    # If approved, mark attendance as 'present' for leave days
    if request.status == 'approved':
        start_date = datetime.fromisoformat(leave['start_date'])
        end_date = datetime.fromisoformat(leave['end_date'])
        
        current_date = start_date
        while current_date <= end_date:
            date_str = current_date.strftime('%Y-%m-%d')
            
            # Mark as present (approved leave counts as present)
            attendance_repo.mark_attendance(
                intern_id=leave['intern_id'],
                date_str=date_str,
                status='present',
                marked_by=current_user['user_id']
            )
            
            current_date += timedelta(days=1)
        
        # AUTO-RECALCULATE STIPEND
        from app.services.stipend_service import calculate_stipend_for_intern
        
        try:
            current_month = leave['start_date'][:7]  # YYYY-MM format
            calculate_stipend_for_intern(leave['intern_id'], current_month)
            print(f"[AUTO-STIPEND] Updated stipend after leave approval for month {current_month}")
        except Exception as e:
            print(f"[AUTO-STIPEND] Failed to update stipend: {e}")
    
    return {"success": True, "message": f"Leave {request.status}"}