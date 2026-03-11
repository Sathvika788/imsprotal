from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional

from app.core.security import get_current_user, require_manager
from app.db.dynamo import project_repo, user_repo
from app.services.s3_service import upload_file

router = APIRouter(prefix="/projects", tags=["projects"])


class ProjectReviewRequest(BaseModel):
    status: str  # 'approved' or 'rejected'
    grade: str  # 'A+', 'A', 'B+', 'B', 'C', 'D', 'F'
    feedback: str


@router.post("/submit")
async def submit_project(
    name: str = Form(...),
    description: str = Form(...),
    track: str = Form(...),
    month: str = Form(...),
    github_link: Optional[str] = Form(None),
    document: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    """Submit a project (interns only)"""
    
    if current_user['role'] not in ['intern']:
        raise HTTPException(status_code=403, detail="Only interns can submit projects")
    
    if track not in ['AWS', 'GenAI']:
        raise HTTPException(status_code=400, detail="Track must be either 'AWS' or 'GenAI'")
    
    # Upload document if provided
    document_url = None
    if document:
        try:
            file_content = await document.read()
            document_url = upload_file(file_content, document.filename, document.content_type)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload document: {str(e)}")
    
    # Create project
    project = project_repo.create_project(
        intern_id=current_user['user_id'],
        name=name,
        description=description,
        track=track,
        month=month,
        github_link=github_link,
        document_url=document_url
    )
    
    return project


@router.get("/my-projects")
async def get_my_projects(current_user: dict = Depends(get_current_user)):
    """Get own projects"""
    projects = project_repo.get_projects_by_intern(current_user['user_id'])
    return projects


@router.get("/all")
async def get_all_projects(current_user: dict = Depends(require_manager)):
    """Get all projects (managers/CEO only)"""
    projects = project_repo.get_all_projects()
    
    # Enrich with intern info
    enriched_projects = []
    for project in projects:
        intern = user_repo.get_user_by_id(project['intern_id'])
        enriched_projects.append({
            **project,
            'intern_name': intern['name'] if intern else 'Unknown',
            'intern_email': intern['email'] if intern else 'Unknown'
        })
    
    return enriched_projects


@router.get("/track/{track}")
async def get_projects_by_track(
    track: str,
    current_user: dict = Depends(require_manager)
):
    """Get all projects by track (managers/CEO only)"""
    if track not in ['AWS', 'GenAI']:
        raise HTTPException(status_code=400, detail="Invalid track")
    
    projects = project_repo.get_projects_by_track(track)
    
    # Enrich with intern info
    enriched_projects = []
    for project in projects:
        intern = user_repo.get_user_by_id(project['intern_id'])
        enriched_projects.append({
            **project,
            'intern_name': intern['name'] if intern else 'Unknown',
            'intern_email': intern['email'] if intern else 'Unknown'
        })
    
    return enriched_projects


@router.get("/month/{month}")
async def get_projects_by_month(
    month: str,
    current_user: dict = Depends(require_manager)
):
    """Get all projects by month (managers/CEO only)"""
    projects = project_repo.get_projects_by_month(month)
    
    # Enrich with intern info
    enriched_projects = []
    for project in projects:
        intern = user_repo.get_user_by_id(project['intern_id'])
        enriched_projects.append({
            **project,
            'intern_name': intern['name'] if intern else 'Unknown',
            'intern_email': intern['email'] if intern else 'Unknown'
        })
    
    return enriched_projects


@router.post("/{project_id}/review")
async def review_project(
    project_id: str,
    request: ProjectReviewRequest,
    current_user: dict = Depends(require_manager)
):
    """Review and grade a project (managers/CEO only)"""
    
    if request.status not in ['approved', 'rejected']:
        raise HTTPException(status_code=400, detail="Status must be 'approved' or 'rejected'")
    
    if request.grade not in ['A+', 'A', 'B+', 'B', 'C', 'D', 'F']:
        raise HTTPException(status_code=400, detail="Invalid grade")
    
    # Get project details
    project = project_repo.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    success = project_repo.update_project_review(
        project_id=project_id,
        status=request.status,
        grade=request.grade,
        feedback=request.feedback,
        reviewed_by=current_user['user_id']
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to review project")
    
    return {"success": True, "message": f"Project {request.status}"}


@router.get("/{project_id}")
async def get_project_details(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get project details"""
    project = project_repo.get_project(project_id)
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check permissions
    if current_user['role'] == 'intern' and project['intern_id'] != current_user['user_id']:
        raise HTTPException(status_code=403, detail="Access forbidden")
    
    # Enrich with intern info
    intern = user_repo.get_user_by_id(project['intern_id'])
    project['intern_name'] = intern['name'] if intern else 'Unknown'
    project['intern_email'] = intern['email'] if intern else 'Unknown'
    
    return project

@router.post("/submit")
async def submit_project(
    name: str = Form(...),
    description: str = Form(...),
    track: str = Form(...),
    month: str = Form(...),
    github_link: Optional[str] = Form(None),
    document: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    """Submit a project (interns only)"""
    
    if current_user['role'] not in ['intern']:
        raise HTTPException(status_code=403, detail="Only interns can submit projects")
    
    if track not in ['AWS', 'GenAI']:
        raise HTTPException(status_code=400, detail="Track must be either 'AWS' or 'GenAI'")
    
    # Upload document if provided
    document_url = None
    if document:
        try:
            file_content = await document.read()
            document_url = upload_file(file_content, document.filename, document.content_type)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload document: {str(e)}")
    
    # Create project
    project = project_repo.create_project(
        intern_id=current_user['user_id'],
        name=name,
        description=description,
        track=track,
        month=month,
        github_link=github_link,
        document_url=document_url
    )
    
    # SEND EMAIL TO INTERN
    from app.services.email_service import send_email
    
    user = user_repo.get_user_by_id(current_user['user_id'])
    if user:
        subject = f"Project Submission Confirmed - {name}"
        body = f"""
        <h2>Project Submission Confirmed</h2>
        <p>Hi {user['name']},</p>
        <p>Your project submission has been received successfully!</p>
        
        <h3>Project Details:</h3>
        <ul>
            <li><strong>Name:</strong> {name}</li>
            <li><strong>Track:</strong> {track}</li>
            <li><strong>Month:</strong> {month}</li>
            <li><strong>Status:</strong> Pending Review</li>
        </ul>
        
        <p>Your project will be reviewed by your manager soon. You'll receive another email once it's been graded.</p>
        
        <p>Best regards,<br>IMS Team</p>
        """
        
        try:
            send_email(user['email'], subject, body)
        except Exception as e:
            print(f"Failed to send project submission email: {e}")
    
    return project