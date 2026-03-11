# Re-export all repositories for easy imports
from app.db.dynamo import user_repo
from app.db.dynamo import invite_repo
from app.db.dynamo import log_repo
from app.db.dynamo import attendance_repo
from app.db.dynamo import task_repo
from app.db.dynamo import expense_repo
from app.db.dynamo import stipend_repo
from app.db.dynamo import leave_repo
from app.db.dynamo import wfh_repo
from app.db.dynamo import project_repo
from app.db.dynamo import relieving_repo  # ADD
from app.db.dynamo import complaint_repo
from app.db.dynamo import kt_repo

__all__ = [
    'user_repo',
    'invite_repo',
    'log_repo',
    'attendance_repo',
    'task_repo',
    'expense_repo',
    'stipend_repo',
    'leave_repo',
    'wfh_repo',
    'project_repo',
    'relieving_repo',  # ADD
    'complaint_repo',
    'kt_repo',
]
