from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional

from app.core.security import get_current_user, require_manager
from app.db.dynamo import kt_repo, user_repo
from app.services.s3_service import upload_file
from app.services.email_service import send_email

router = APIRouter(prefix="/kt", tags=["knowledge-transfer"])


class KTReviewRequest(BaseModel):
    grade: str  # 'A+', 'A', 'B+', 'B', 'C', 'D', 'F'
    suggestions: str


@router.post("/submit")
async def submit_kt(
    topic: str = Form(...),
    description: str = Form(...),
    document: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    """Submit Knowledge Transfer document (interns only)"""
    
    if current_user['role'] not in ['intern']:
        raise HTTPException(status_code=403, detail="Only interns can submit KT documents")
    
    # Upload document if provided
    document_url = None
    if document:
        try:
            file_content = await document.read()
            document_url = upload_file(file_content, document.filename, document.content_type)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload document: {str(e)}")
    
    kt = kt_repo.create_kt(
        intern_id=current_user['user_id'],
        topic=topic,
        description=description,
        document_url=document_url
    )
    
    # Send confirmation email
    user = user_repo.get_user_by_id(current_user['user_id'])
    if user:
        subject = "Knowledge Transfer Document Submitted"
        body = f"""
        <h2>KT Document Submitted Successfully</h2>
        <p>Hi {user['name']},</p>
        <p>Your Knowledge Transfer document has been submitted and is pending review.</p>
        
        <h3>Details:</h3>
        <ul>
            <li><strong>Topic:</strong> {topic}</li>
            <li><strong>Status:</strong> Pending Review</li>
        </ul>
        
        <p>You will receive feedback once it has been reviewed by your manager.</p>
        
        <p>Best regards,<br>IMS Team</p>
        """
        
        try:
            send_email(user['email'], subject, body)
        except Exception as e:
            print(f"Failed to send KT submission email: {e}")
    
    return kt


@router.get("/my-kts")
async def get_my_kts(current_user: dict = Depends(get_current_user)):
    """Get own KT documents"""
    kts = kt_repo.get_kts_by_intern(current_user['user_id'])
    return kts


@router.get("/all")
async def get_all_kts(current_user: dict = Depends(require_manager)):
    """Get all KT documents (managers/CEO only)"""
    kts = kt_repo.get_all_kts()
    
    # Enrich with intern info
    enriched_kts = []
    for kt in kts:
        intern = user_repo.get_user_by_id(kt['intern_id'])
        enriched_kts.append({
            **kt,
            'intern_name': intern['name'] if intern else 'Unknown',
            'intern_email': intern['email'] if intern else 'Unknown'
        })
    
    return enriched_kts


@router.post("/{kt_id}/review")
async def review_kt(
    kt_id: str,
    request: KTReviewRequest,
    current_user: dict = Depends(require_manager)
):
    """Review KT document (managers/CEO only)"""
    
    if request.grade not in ['A+', 'A', 'B+', 'B', 'C', 'D', 'F']:
        raise HTTPException(status_code=400, detail="Invalid grade")
    
    kt = kt_repo.get_kt(kt_id)
    if not kt:
        raise HTTPException(status_code=404, detail="KT document not found")
    
    success = kt_repo.review_kt(
        kt_id=kt_id,
        grade=request.grade,
        suggestions=request.suggestions,
        reviewed_by=current_user['user_id'],
        status='reviewed'
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to review KT")
    
    # Send email to intern
    intern = user_repo.get_user_by_id(kt['intern_id'])
    if intern:
        subject = f"KT Document Reviewed: {kt['topic']}"
        body = f"""
        <h2>Your KT Document Has Been Reviewed</h2>
        <p>Hi {intern['name']},</p>
        <p>Your Knowledge Transfer document has been reviewed by your manager.</p>
        
        <h3>Document:</h3>
        <p><strong>{kt['topic']}</strong></p>
        
        <h3>Grade:</h3>
        <p style="font-size: 24px; color: #00d4aa;"><strong>{request.grade}</strong></p>
        
        <h3>Manager's Suggestions:</h3>
        <p>{request.suggestions}</p>
        
        <p>Keep up the good work!</p>
        
        <p>Best regards,<br>IMS Team</p>
        """
        
        try:
            send_email(intern['email'], subject, body)
        except Exception as e:
            print(f"Failed to send KT review email: {e}")
    
    return {"success": True, "message": "KT reviewed successfully"}


@router.get("/{kt_id}")
async def get_kt_details(
    kt_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get KT document details"""
    kt = kt_repo.get_kt(kt_id)
    
    if not kt:
        raise HTTPException(status_code=404, detail="KT document not found")
    
    # Check permissions
    if current_user['role'] == 'intern' and kt['intern_id'] != current_user['user_id']:
        raise HTTPException(status_code=403, detail="Access forbidden")
    
    # Enrich with intern info
    intern = user_repo.get_user_by_id(kt['intern_id'])
    kt['intern_name'] = intern['name'] if intern else 'Unknown'
    kt['intern_email'] = intern['email'] if intern else 'Unknown'
    
    return kt