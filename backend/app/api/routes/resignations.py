from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.core.security import get_current_user, require_manager
from app.db.dynamo import resignation_repo, user_repo
from app.services.email_service import send_email

router = APIRouter(prefix="/resignations", tags=["resignations"])


class ResignationCreateRequest(BaseModel):
    reason: str
    last_working_day: str
    notice_period_days: int = 30


class ResignationReviewRequest(BaseModel):
    status: str  # 'accepted' or 'rejected'
    review_notes: Optional[str] = None


@router.post("/submit")
async def submit_resignation(
    request: ResignationCreateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Submit resignation (interns only)"""
    
    if current_user['role'] not in ['intern']:
        raise HTTPException(status_code=403, detail="Only interns can submit resignations")
    
    resignation = resignation_repo.create_resignation(
        intern_id=current_user['user_id'],
        reason=request.reason,
        last_working_day=request.last_working_day,
        notice_period_days=request.notice_period_days
    )
    
    # Send confirmation email to intern
    user = user_repo.get_user_by_id(current_user['user_id'])
    if user:
        subject = "Resignation Submitted Successfully"
        body = f"""
        <h2>Resignation Submitted</h2>
        <p>Hi {user['name']},</p>
        <p>Your resignation has been submitted and is pending review by management.</p>
        
        <h3>Details:</h3>
        <ul>
            <li><strong>Last Working Day:</strong> {request.last_working_day}</li>
            <li><strong>Notice Period:</strong> {request.notice_period_days} days</li>
            <li><strong>Status:</strong> Pending Review</li>
        </ul>
        
        <p>You will be notified once your resignation is reviewed.</p>
        
        <p>Best regards,<br>IMS Team</p>
        """
        
        try:
            send_email(user['email'], subject, body)
        except Exception as e:
            print(f"Failed to send resignation email: {e}")
    
    return resignation


@router.get("/my-resignations")
async def get_my_resignations(current_user: dict = Depends(get_current_user)):
    """Get own resignations"""
    resignations = resignation_repo.get_resignations_by_intern(current_user['user_id'])
    return resignations


@router.get("/all")
async def get_all_resignations(current_user: dict = Depends(require_manager)):
    """Get all resignations (managers/CEO only)"""
    resignations = resignation_repo.get_all_resignations()
    
    # Enrich with intern info
    enriched_resignations = []
    for resignation in resignations:
        intern = user_repo.get_user_by_id(resignation['intern_id'])
        enriched_resignations.append({
            **resignation,
            'intern_name': intern['name'] if intern else 'Unknown',
            'intern_email': intern['email'] if intern else 'Unknown'
        })
    
    return enriched_resignations


@router.post("/{resignation_id}/review")
async def review_resignation(
    resignation_id: str,
    request: ResignationReviewRequest,
    current_user: dict = Depends(require_manager)
):
    """Review resignation (managers/CEO only)"""
    
    if request.status not in ['accepted', 'rejected']:
        raise HTTPException(status_code=400, detail="Status must be 'accepted' or 'rejected'")
    
    resignation = resignation_repo.get_resignation(resignation_id)
    if not resignation:
        raise HTTPException(status_code=404, detail="Resignation not found")
    
    success = resignation_repo.update_resignation_status(
        resignation_id=resignation_id,
        status=request.status,
        reviewed_by=current_user['user_id'],
        review_notes=request.review_notes
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update resignation")
    
    # Send email to intern
    intern = user_repo.get_user_by_id(resignation['intern_id'])
    if intern:
        subject = f"Resignation {request.status.capitalize()}"
        body = f"""
        <h2>Resignation {request.status.capitalize()}</h2>
        <p>Hi {intern['name']},</p>
        <p>Your resignation has been {request.status}.</p>
        
        {f'<p><strong>Notes:</strong> {request.review_notes}</p>' if request.review_notes else ''}
        
        <p>Best regards,<br>IMS Team</p>
        """
        
        try:
            send_email(intern['email'], subject, body)
        except Exception as e:
            print(f"Failed to send resignation review email: {e}")
    
    return {"success": True, "message": f"Resignation {request.status}"}

@router.post("/{resignation_id}/review")
async def review_resignation(
    resignation_id: str,
    request: ResignationReviewRequest,
    current_user: dict = Depends(require_manager)
):
    """Review resignation (managers/CEO only)"""
    
    if request.status not in ['accepted', 'rejected']:
        raise HTTPException(status_code=400, detail="Status must be 'accepted' or 'rejected'")
    
    resignation = resignation_repo.get_resignation(resignation_id)
    if not resignation:
        raise HTTPException(status_code=404, detail="Resignation not found")
    
    success = resignation_repo.update_resignation_status(
        resignation_id=resignation_id,
        status=request.status,
        reviewed_by=current_user['user_id'],
        review_notes=request.review_notes
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update resignation")
    
    # DELETE INTERN CREDENTIALS IF ACCEPTED
    if request.status == 'accepted':
        intern = user_repo.get_user_by_id(resignation['intern_id'])
        if intern:
            # Delete user
            user_deleted = user_repo.delete_user(resignation['intern_id'])
            
            if user_deleted:
                print(f"[RESIGNATION] Deleted user credentials for {intern['email']}")
                
                # Send final email before deletion
                from app.services.email_service import send_email
                
                subject = "Resignation Accepted - Account Deactivated"
                body = f"""
                <h2>Resignation Accepted</h2>
                <p>Hi {intern['name']},</p>
                <p>Your resignation has been accepted by management.</p>
                
                <h3>Last Working Day:</h3>
                <p>{resignation['last_working_day']}</p>
                
                {f'<p><strong>Management Notes:</strong> {request.review_notes}</p>' if request.review_notes else ''}
                
                <p><strong>Important:</strong> Your account has been deactivated. You will no longer have access to the IMS system.</p>
                
                <p>We wish you all the best in your future endeavors!</p>
                
                <p>Best regards,<br>IMS Team</p>
                """
                
                try:
                    send_email(intern['email'], subject, body)
                except Exception as e:
                    print(f"Failed to send resignation acceptance email: {e}")
    else:
        # Send rejection email
        intern = user_repo.get_user_by_id(resignation['intern_id'])
        if intern:
            from app.services.email_service import send_email
            
            subject = "Resignation Not Accepted"
            body = f"""
            <h2>Resignation Not Accepted</h2>
            <p>Hi {intern['name']},</p>
            <p>After careful consideration, your resignation has not been accepted at this time.</p>
            
            {f'<p><strong>Reason:</strong> {request.review_notes}</p>' if request.review_notes else ''}
            
            <p>Please schedule a meeting with your manager to discuss this further.</p>
            
            <p>Best regards,<br>IMS Team</p>
            """
            
            try:
                send_email(intern['email'], subject, body)
            except Exception as e:
                print(f"Failed to send resignation rejection email: {e}")
    
    return {"success": True, "message": f"Resignation {request.status}"}