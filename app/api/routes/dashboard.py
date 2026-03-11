from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timedelta

from app.core.security import get_current_user, require_manager, require_ceo
from app.db.dynamo import (
    user_repo, log_repo, attendance_repo, task_repo,
    expense_repo, stipend_repo, leave_repo, wfh_repo
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/intern/stats")
async def get_intern_stats(current_user: dict = Depends(get_current_user)):
    """Get stats for intern dashboard"""
    
    if current_user['role'] != 'intern':
        raise HTTPException(status_code=403, detail="Only for interns")
    
    intern_id = current_user['user_id']
    
    # Get user info to get email
    user = user_repo.get_user_by_id(intern_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get current month
    now = datetime.now()
    current_month = now.strftime('%Y-%m')
    
    # Get logs
    logs = log_repo.get_logs_by_intern(intern_id)
    pending_logs = len([l for l in logs if l.get('status') == 'pending'])
    verified_logs = len([l for l in logs if l.get('status') == 'verified'])
    
    # Get attendance
    attendance_counts = attendance_repo.count_attendance_by_status(intern_id, current_month)
    
    # Get tasks - UPDATED to use email
    tasks = task_repo.get_tasks_by_email(user['email'])
    pending_tasks = len([t for t in tasks if t['status'] == 'pending'])
    in_progress_tasks = len([t for t in tasks if t['status'] == 'in_progress'])
    completed_tasks = len([t for t in tasks if t['status'] == 'completed'])
    
    # Get expenses
    expenses = expense_repo.get_expenses_by_intern(intern_id)
    pending_expenses = len([e for e in expenses if e['status'] == 'pending'])
    approved_expenses_total = sum([float(e['amount']) for e in expenses if e['status'] == 'approved'])
    
    # Get current month stipend
    stipend = stipend_repo.get_stipend(intern_id, current_month)
    
    return {
        "logs": {
            "total": len(logs),
            "pending": pending_logs,
            "verified": verified_logs
        },
        "attendance": attendance_counts,
        "tasks": {
            "total": len(tasks),
            "pending": pending_tasks,
            "in_progress": in_progress_tasks,
            "completed": completed_tasks
        },
        "expenses": {
            "total": len(expenses),
            "pending": pending_expenses,
            "approved_total": approved_expenses_total
        },
        "stipend": stipend
    }


@router.get("/manager/stats")
async def get_manager_stats(current_user: dict = Depends(require_manager)):
    """Get stats for manager dashboard"""
    
    # Get all interns
    interns = user_repo.get_users_by_role('intern')
    total_interns = len(interns)
    
    # Get today's date
    today = datetime.now().date().isoformat()
    
    # Get logs submitted today
    today_logs = log_repo.get_logs_by_date(today)
    pending_verifications = len([l for l in today_logs if l.get('status') == 'pending'])
    
    # Get all expenses
    expenses = expense_repo.get_all_expenses()
    pending_expenses = len([e for e in expenses if e['status'] == 'pending'])
    
    # Get all tasks - UPDATED to use email
    all_tasks = []
    for intern in interns:
        tasks = task_repo.get_tasks_by_email(intern['email'])
        all_tasks.extend(tasks)
    
    overdue_tasks = []
    today_date = datetime.now().date()
    for task in all_tasks:
        if task['status'] != 'completed' and task.get('due_date'):
            try:
                due_date = datetime.fromisoformat(task['due_date']).date()
                if due_date < today_date:
                    overdue_tasks.append(task)
            except:
                pass
    
    return {
        "total_interns": total_interns,
        "pending_verifications": pending_verifications,
        "pending_expenses": pending_expenses,
        "overdue_tasks": len(overdue_tasks)
    }


@router.get("/ceo/analytics")
async def get_ceo_analytics(current_user: dict = Depends(require_ceo)):
    """Get comprehensive analytics for CEO dashboard"""
    
    # Get all users by role
    interns = user_repo.get_users_by_role('intern')
    managers = user_repo.get_users_by_role('manager')
    
    # Get current month
    now = datetime.now()
    current_month = now.strftime('%Y-%m')
    
    # Attendance overview
    total_present = 0
    total_late = 0
    total_absent = 0
    
    for intern in interns:
        counts = attendance_repo.count_attendance_by_status(intern['id'], current_month)
        total_present += counts.get('present', 0)
        total_late += counts.get('late', 0)
        total_absent += counts.get('absent', 0)
    
    # Stipend overview
    try:
        stipends = stipend_repo.get_all_stipends_for_month(current_month)
    except:
        # Fallback if function doesn't exist
        stipends = []
        for intern in interns:
            stipend = stipend_repo.get_stipend(intern['id'], current_month)
            if stipend:
                stipends.append(stipend)
    
    total_stipend = sum([s.get('total_amount', 0) for s in stipends])
    paid_stipends = len([s for s in stipends if s.get('paid', False)])
    unpaid_stipends = len([s for s in stipends if not s.get('paid', False)])
    
    # Expense overview
    expenses = expense_repo.get_all_expenses()
    current_month_expenses = [e for e in expenses if e['date'].startswith(current_month)]
    pending_expenses = len([e for e in current_month_expenses if e['status'] == 'pending'])
    approved_expenses = len([e for e in current_month_expenses if e['status'] == 'approved'])
    total_expense_amount = sum([float(e['amount']) for e in current_month_expenses if e['status'] == 'approved'])
    
    # Task completion rate - UPDATED to use email
    all_tasks = []
    for intern in interns:
        tasks = task_repo.get_tasks_by_email(intern['email'])
        all_tasks.extend(tasks)
    
    completed_tasks = len([t for t in all_tasks if t['status'] == 'completed'])
    total_tasks = len(all_tasks)
    completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
    
    # Logs verification rate
    all_logs = []
    for intern in interns:
        logs = log_repo.get_logs_by_intern(intern['id'])
        all_logs.extend(logs)
    
    verified_logs = len([l for l in all_logs if l.get('status') == 'verified'])
    total_logs = len(all_logs)
    verification_rate = (verified_logs / total_logs * 100) if total_logs > 0 else 0
    
    # Recent activity (last 7 days)
    recent_logs = []
    for i in range(7):
        date = (now - timedelta(days=i)).date().isoformat()
        logs = log_repo.get_logs_by_date(date)
        recent_logs.append({
            "date": date,
            "count": len(logs)
        })
    
    return {
        "overview": {
            "total_interns": len(interns),
            "total_managers": len(managers),
            "total_users": len(interns) + len(managers) + 1  # +1 for CEO
        },
        "attendance": {
            "present": total_present,
            "late": total_late,
            "absent": total_absent,
            "attendance_rate": ((total_present + total_late) / (total_present + total_late + total_absent) * 100) if (total_present + total_late + total_absent) > 0 else 0
        },
        "stipends": {
            "total_amount": total_stipend,
            "paid_count": paid_stipends,
            "unpaid_count": unpaid_stipends
        },
        "expenses": {
            "pending": pending_expenses,
            "approved": approved_expenses,
            "total_amount": total_expense_amount
        },
        "tasks": {
            "total": total_tasks,
            "completed": completed_tasks,
            "completion_rate": completion_rate
        },
        "logs": {
            "total": total_logs,
            "verified": verified_logs,
            "verification_rate": verification_rate
        },
        "recent_activity": recent_logs
    }
