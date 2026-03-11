from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.core.security import get_current_user, require_manager
from app.db.dynamo import task_repo, user_repo

router = APIRouter(prefix="/tasks", tags=["tasks"])


class TaskCreateRequest(BaseModel):
    assigned_to_email: str  # Accept email
    title: str
    description: str
    due_date: Optional[str] = None
    priority: str = 'medium'  # 'low', 'medium', 'high'


class TaskUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[str] = None
    priority: Optional[str] = None


class TaskStatusUpdate(BaseModel):
    status: str  # 'pending', 'in_progress', 'completed'


@router.post("/")
async def create_task(
    request: TaskCreateRequest,
    current_user: dict = Depends(require_manager)
):
    """Create a task for an intern (managers/CEO only)"""
    
    if request.priority not in ['low', 'medium', 'high']:
        raise HTTPException(status_code=400, detail="Invalid priority")
    
    # Verify intern exists by email
    intern = user_repo.get_user_by_email(request.assigned_to_email)
    if not intern or intern['role'] != 'intern':
        raise HTTPException(status_code=404, detail="Intern not found")
    
    task = task_repo.create_task(
        assigned_to_email=request.assigned_to_email,
        title=request.title,
        description=request.description,
        due_date=request.due_date or None,
        priority=request.priority,
        assigned_by=current_user['user_id']
    )
    
    return task


@router.get("/all")
async def get_all_tasks(current_user: dict = Depends(require_manager)):
    """Get all tasks (managers/CEO only)"""
    tasks = task_repo.get_all_tasks()
    
    # Enrich with assigner info
    enriched_tasks = []
    for task in tasks:
        assigner = user_repo.get_user_by_id(task['assigned_by'])
        enriched_tasks.append({
            **task,
            'assigned_by_name': assigner['name'] if assigner else 'Unknown'
        })
    
    return enriched_tasks


@router.get("/my-tasks")
async def get_my_tasks(current_user: dict = Depends(get_current_user)):
    """Get own tasks"""
    tasks = task_repo.get_tasks_by_email(current_user['email'])
    
    # Enrich with assigner info
    enriched_tasks = []
    for task in tasks:
        assigner = user_repo.get_user_by_id(task['assigned_by'])
        enriched_tasks.append({
            **task,
            'assigned_by_name': assigner['name'] if assigner else 'Unknown'
        })
    
    return enriched_tasks


@router.get("/intern/{intern_email}")
async def get_intern_tasks(
    intern_email: str,
    current_user: dict = Depends(require_manager)
):
    """Get tasks for a specific intern (managers/CEO only)"""
    tasks = task_repo.get_tasks_by_email(intern_email)
    
    # Get intern info
    intern = user_repo.get_user_by_email(intern_email)
    
    # Enrich with assigner info
    enriched_tasks = []
    for task in tasks:
        assigner = user_repo.get_user_by_id(task['assigned_by'])
        enriched_tasks.append({
            **task,
            'assigned_by_name': assigner['name'] if assigner else 'Unknown'
        })
    
    return {
        "intern": intern,
        "tasks": enriched_tasks
    }


@router.patch("/{task_id}/status")
async def update_task_status(
    task_id: str,
    request: TaskStatusUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update task status"""
    
    if request.status not in ['pending', 'in_progress', 'completed']:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    # Get task to verify ownership
    task = task_repo.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Interns can only update their own tasks
    if current_user['role'] == 'intern' and task['assigned_to_email'] != current_user['email']:
        raise HTTPException(status_code=403, detail="Access forbidden")
    
    success = task_repo.update_task_status(task_id, request.status)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update task")
    
    return {"success": True, "message": "Task status updated"}


@router.patch("/{task_id}")
async def update_task(
    task_id: str,
    request: TaskUpdateRequest,
    current_user: dict = Depends(require_manager)
):
    """Update task details (managers/CEO only)"""
    
    # Get task to verify it exists
    task = task_repo.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Build updates dict
    updates = {}
    if request.title:
        updates['title'] = request.title
    if request.description:
        updates['description'] = request.description
    if request.due_date:
        updates['due_date'] = request.due_date
    if request.priority:
        if request.priority not in ['low', 'medium', 'high']:
            raise HTTPException(status_code=400, detail="Invalid priority")
        updates['priority'] = request.priority
    
    if not updates:
        raise HTTPException(status_code=400, detail="No updates provided")
    
    success = task_repo.update_task(task_id, updates)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update task")
    
    return {"success": True, "message": "Task updated"}


@router.delete("/{task_id}")
async def delete_task(
    task_id: str,
    current_user: dict = Depends(require_manager)
):
    """Delete a task (managers/CEO only)"""
    
    success = task_repo.delete_task(task_id)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete task")
    
    return {"success": True, "message": "Task deleted"}
