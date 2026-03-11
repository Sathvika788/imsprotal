from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.core.security import get_current_user, require_manager
from app.db.dynamo import complaint_repo, user_repo
from app.services.email_service import send_email

router = APIRouter(prefix="/complaints", tags=["complaints"])


class ComplaintCreateRequest(BaseModel):
    subject: str
    description: str
    category: str  # 'work_environment', 'harassment', 'technical', 'other'
    is_anonymous: bool = False


class ComplaintResponseRequest(BaseModel):
    response: str
    status: str = 'resolved'


@router.post("/submit")
async def submit_complaint(
    request: ComplaintCreateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Submit a complaint (interns only)"""
    
    if current_user['role'] not in ['intern']:
        raise HTTPException(status_code=403, detail="Only interns can submit complaints")
    
    if request.category not in ['work_environment', 'harassment', 'technical', 'other']:
        raise HTTPException(status_code=400, detail="Invalid category")
    
    complaint = complaint_repo.create_complaint(
        intern_id=current_user['user_id'],
        subject=request.subject,
        description=request.description,
        category=request.category,
        is_anonymous=request.is_anonymous
    )
    
    # Send confirmation email
    user = user_repo.get_user_by_id(current_user['user_id'])
    if user:
        subject = "Complaint Submitted Successfully"
        body = f"""
        <h2>Complaint Submitted</h2>
        <p>Hi {user['name']},</p>
        <p>Your complaint has been submitted and will be reviewed by management.</p>
        
        <h3>Details:</h3>
        <ul>
            <li><strong>Subject:</strong> {request.subject}</li>
            <li><strong>Category:</strong> {request.category.replace('_', ' ').title()}</li>
            <li><strong>Anonymous:</strong> {'Yes' if request.is_anonymous else 'No'}</li>
            <li><strong>Status:</strong> Pending</li>
        </ul>
        
        <p>We take all complaints seriously and will respond as soon as possible.</p>
        
        <p>Best regards,<br>IMS Team</p>
        """
        
        try:
            send_email(user['email'], subject, body)
        except Exception as e:
            print(f"Failed to send complaint email: {e}")
    
    return complaint


@router.get("/my-complaints")
async def get_my_complaints(current_user: dict = Depends(get_current_user)):
    """Get own complaints"""
    complaints = complaint_repo.get_complaints_by_intern(current_user['user_id'])
    return complaints


@router.get("/all")
async def get_all_complaints(current_user: dict = Depends(require_manager)):
    """Get all complaints (managers/CEO only)"""
    complaints = complaint_repo.get_all_complaints()
    
    # Enrich with intern info (unless anonymous)
    enriched_complaints = []
    for complaint in complaints:
        if complaint['is_anonymous']:
            enriched_complaints.append({
                **complaint,
                'intern_name': 'Anonymous',
                'intern_email': 'Anonymous'
            })
        else:
            intern = user_repo.get_user_by_id(complaint['intern_id'])
            enriched_complaints.append({
                **complaint,
                'intern_name': intern['name'] if intern else 'Unknown',
                'intern_email': intern['email'] if intern else 'Unknown'
            })
    
    return enriched_complaints


@router.post("/{complaint_id}/respond")
async def respond_to_complaint(
    complaint_id: str,
    request: ComplaintResponseRequest,
    current_user: dict = Depends(require_manager)
):
    """Respond to a complaint (managers/CEO only)"""
    
    complaint = complaint_repo.get_complaint(complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    success = complaint_repo.respond_to_complaint(
        complaint_id=complaint_id,
        response=request.response,
        responded_by=current_user['user_id'],
        status=request.status
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to respond to complaint")
    
    # Send email to intern
    intern = user_repo.get_user_by_id(complaint['intern_id'])
    if intern:
        subject = f"Response to Your Complaint: {complaint['subject']}"
        body = f"""
        <h2>Complaint Response</h2>
        <p>Hi {intern['name']},</p>
        <p>We have responded to your complaint.</p>
        
        <h3>Your Complaint:</h3>
        <p>{complaint['subject']}</p>
        
        <h3>Our Response:</h3>
        <p>{request.response}</p>
        
        <p><strong>Status:</strong> {request.status.capitalize()}</p>
        
        <p>If you have any further concerns, please don't hesitate to reach out.</p>
        
        <p>Best regards,<br>IMS Team</p>
        """
        
        try:
            send_email(intern['email'], subject, body)
        except Exception as e:
            print(f"Failed to send complaint response email: {e}")
    
    return {"success": True, "message": "Response sent"}