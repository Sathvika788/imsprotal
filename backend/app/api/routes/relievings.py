from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.core.security import get_current_user, require_manager
from app.db.dynamo import relieving_repo, user_repo
from app.services.email_service import send_email

router = APIRouter(prefix="/relievings", tags=["relievings"])


class RelievingCreateRequest(BaseModel):
    reason: str
    last_working_day: str
    notice_period_days: int = 30


class RelievingReviewRequest(BaseModel):
    status: str  # 'accepted' or 'rejected'
    review_notes: Optional[str] = None


@router.post("/submit")
async def submit_relieving(
    request: RelievingCreateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Submit relieving (interns only)"""
    
    if current_user['role'] not in ['intern']:
        raise HTTPException(status_code=403, detail="Only interns can submit relieving")
    
    relieving = relieving_repo.create_relieving(
        intern_id=current_user['user_id'],
        reason=request.reason,
        last_working_day=request.last_working_day,
        notice_period_days=request.notice_period_days
    )
    
    # Send confirmation email to intern
    user = user_repo.get_user_by_id(current_user['user_id'])
    if user:
        subject = "Relieving Submitted Successfully"
        body = f"""
        <h2>Relieving Submitted</h2>
        <p>Hi {user['name']},</p>
        <p>Your relieving has been submitted and is pending review by management.</p>
        
        <h3>Details:</h3>
        <ul>
            <li><strong>Last Working Day:</strong> {request.last_working_day}</li>
            <li><strong>Notice Period:</strong> {request.notice_period_days} days</li>
            <li><strong>Status:</strong> Pending Review</li>
        </ul>
        
        <p>You will be notified once your relieving is reviewed.</p>
        
        <p>Best regards,<br>IMS Team</p>
        """
        
        try:
            send_email(user['email'], subject, body)
        except Exception as e:
            print(f"Failed to send relieving email: {e}")
    
    return relieving


@router.get("/my-relievings")
async def get_my_relievings(current_user: dict = Depends(get_current_user)):
    """Get own relievings"""
    relievings = relieving_repo.get_relievings_by_intern(current_user['user_id'])
    return relievings


@router.get("/all")
async def get_all_relievings(current_user: dict = Depends(require_manager)):
    """Get all relievings (managers/CEO only)"""
    relievings = relieving_repo.get_all_relievings()
    
    # Enrich with intern info
    enriched_relievings = []
    for relieving in relievings:
        intern = user_repo.get_user_by_id(relieving['intern_id'])
        enriched_relievings.append({
            **relieving,
            'intern_name': intern['name'] if intern else 'Unknown',
            'intern_email': intern['email'] if intern else 'Unknown'
        })
    
    return enriched_relievings


@router.post("/{relieving_id}/review")
async def review_relieving(
    relieving_id: str,
    request: RelievingReviewRequest,
    current_user: dict = Depends(require_manager)
):
    """Review relieving (managers/CEO only)"""
    
    if request.status not in ['accepted', 'rejected']:
        raise HTTPException(status_code=400, detail="Status must be 'accepted' or 'rejected'")
    
    relieving = relieving_repo.get_relieving(relieving_id)
    if not relieving:
        raise HTTPException(status_code=404, detail="Relieving not found")
    
    success = relieving_repo.update_relieving_status(
        relieving_id=relieving_id,
        status=request.status,
        reviewed_by=current_user['user_id'],
        review_notes=request.review_notes
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update relieving")
    
    # Send email to intern
    intern = user_repo.get_user_by_id(relieving['intern_id'])
    if intern:
        subject = f"Relieving {request.status.capitalize()}"
        body = f"""
        <h2>Relieving {request.status.capitalize()}</h2>
        <p>Hi {intern['name']},</p>
        <p>Your relieving has been {request.status}.</p>
        
        {f'<p><strong>Notes:</strong> {request.review_notes}</p>' if request.review_notes else ''}
        
        <p>Best regards,<br>IMS Team</p>
        """
        
        try:
            send_email(intern['email'], subject, body)
        except Exception as e:
            print(f"Failed to send relieving review email: {e}")
    
    return {"success": True, "message": f"Relieving {request.status}"}
