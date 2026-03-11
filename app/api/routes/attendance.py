from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.core.security import get_current_user, require_manager
from app.db.dynamo import attendance_repo, user_repo

router = APIRouter(prefix="/attendance", tags=["attendance"])


class AttendanceOverrideRequest(BaseModel):
    intern_id: str
    date: str
    status: str  # 'present', 'late', 'absent'


@router.get("/my-attendance")
async def get_my_attendance(current_user: dict = Depends(get_current_user)):
    """Get own attendance records"""
    records = attendance_repo.get_attendance_by_intern(current_user['user_id'])
    return records


@router.get("/intern/{intern_id}")
async def get_intern_attendance(
    intern_id: str,
    current_user: dict = Depends(require_manager)
):
    """Get attendance for a specific intern (managers/CEO only)"""
    records = attendance_repo.get_attendance_by_intern(intern_id)
    
    # Get intern info
    intern = user_repo.get_user_by_id(intern_id)
    
    return {
        "intern": intern,
        "records": records
    }


@router.get("/date/{date}")
async def get_attendance_by_date(
    date: str,
    current_user: dict = Depends(require_manager)
):
    """Get all attendance for a specific date (managers/CEO only)"""
    records = attendance_repo.get_attendance_by_date(date)
    
    # Enrich with intern info
    enriched_records = []
    for record in records:
        intern = user_repo.get_user_by_id(record['intern_id'])
        enriched_records.append({
            **record,
            'intern_name': intern['name'] if intern else 'Unknown',
            'intern_email': intern['email'] if intern else 'Unknown'
        })
    
    return enriched_records


@router.post("/override")
async def override_attendance(
    request: AttendanceOverrideRequest,
    current_user: dict = Depends(require_manager)
):
    """Override attendance for an intern (managers/CEO only)"""
    
    if request.status not in ['present', 'late', 'absent']:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    # Verify intern exists
    intern = user_repo.get_user_by_id(request.intern_id)
    if not intern or intern['role'] != 'intern':
        raise HTTPException(status_code=404, detail="Intern not found")
    
    record = attendance_repo.mark_attendance(
        intern_id=request.intern_id,
        date_str=request.date,
        status=request.status,
        marked_by=current_user['user_id']
    )
    
    return record


@router.get("/stats/{intern_id}/{month}")
async def get_attendance_stats(
    intern_id: str,
    month: str,
    current_user: dict = Depends(get_current_user)
):
    """Get attendance statistics for a month (format: YYYY-MM)"""
    
    # Interns can only view their own stats
    if current_user['role'] == 'intern' and current_user['user_id'] != intern_id:
        raise HTTPException(status_code=403, detail="Access forbidden")
    
    counts = attendance_repo.count_attendance_by_status(intern_id, month)
    return counts
@router.post("/override")
async def override_attendance(
    request: AttendanceOverrideRequest,
    current_user: dict = Depends(require_manager)
):
    """Override attendance for an intern (managers/CEO only)"""
    
    if request.status not in ['present', 'late', 'absent']:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    # Verify intern exists
    intern = user_repo.get_user_by_id(request.intern_id)
    if not intern or intern['role'] != 'intern':
        raise HTTPException(status_code=404, detail="Intern not found")
    
    record = attendance_repo.mark_attendance(
        intern_id=request.intern_id,
        date_str=request.date,
        status=request.status,
        marked_by=current_user['user_id']
    )
    
    # AUTO-RECALCULATE STIPEND
    from app.services.stipend_service import calculate_stipend_for_intern
    
    try:
        current_month = request.date[:7]  # YYYY-MM format
        calculate_stipend_for_intern(request.intern_id, current_month)
        print(f"[AUTO-STIPEND] Updated stipend after attendance override for month {current_month}")
    except Exception as e:
        print(f"[AUTO-STIPEND] Failed to update stipend: {e}")
    
    return record
