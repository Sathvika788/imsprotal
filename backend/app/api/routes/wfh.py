from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.core.security import get_current_user, require_manager
from app.db.dynamo import wfh_repo, user_repo

router = APIRouter(prefix="/wfh", tags=["wfh"])


class WFHCreateRequest(BaseModel):
    date: str
    reason: str


class WFHReviewRequest(BaseModel):
    status: str  # 'approved' or 'rejected'


@router.post("/request")
async def request_wfh(
    request: WFHCreateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Request work from home (interns only)"""
    
    if current_user['role'] not in ['intern']:
        raise HTTPException(status_code=403, detail="Only interns can request WFH")
    
    # Validate date
    try:
        wfh_date = datetime.fromisoformat(request.date)
        
        if wfh_date.date() < datetime.now().date():
            raise HTTPException(status_code=400, detail="Cannot request WFH for past dates")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")
    
    wfh = wfh_repo.create_wfh_request(
        intern_id=current_user['user_id'],
        date=request.date,
        reason=request.reason
    )
    
    return wfh


@router.get("/my-wfh")
async def get_my_wfh(current_user: dict = Depends(get_current_user)):
    """Get own WFH requests"""
    wfh_requests = wfh_repo.get_wfh_by_intern(current_user['user_id'])
    return wfh_requests


@router.get("/all")
async def get_all_wfh(current_user: dict = Depends(require_manager)):
    """Get all WFH requests (managers/CEO only)"""
    wfh_requests = wfh_repo.get_all_wfh_requests()
    
    # Enrich with intern info
    enriched_wfh = []
    for wfh in wfh_requests:
        intern = user_repo.get_user_by_id(wfh['intern_id'])
        enriched_wfh.append({
            **wfh,
            'intern_name': intern['name'] if intern else 'Unknown',
            'intern_email': intern['email'] if intern else 'Unknown'
        })
    
    return enriched_wfh


@router.post("/{wfh_id}/review")
async def review_wfh(
    wfh_id: str,
    request: WFHReviewRequest,
    current_user: dict = Depends(require_manager)
):
    """Approve or reject WFH request (managers/CEO only)"""
    
    if request.status not in ['approved', 'rejected']:
        raise HTTPException(status_code=400, detail="Status must be 'approved' or 'rejected'")
    
    # Get WFH details
    wfh = wfh_repo.get_wfh_request(wfh_id)
    if not wfh:
        raise HTTPException(status_code=404, detail="WFH request not found")
    
    success = wfh_repo.update_wfh_status(
        wfh_id=wfh_id,
        status=request.status,
        reviewed_by=current_user['user_id']
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update WFH request")
    
    return {"success": True, "message": f"WFH request {request.status}"}