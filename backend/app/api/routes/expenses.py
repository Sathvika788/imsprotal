from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional

from app.core.security import get_current_user, require_manager
from app.db.dynamo import expense_repo, user_repo
from app.services.s3_service import upload_file

router = APIRouter(prefix="/expenses", tags=["expenses"])


class ExpenseReviewRequest(BaseModel):
    status: str  # 'approved' or 'rejected'
    review_notes: Optional[str] = None


@router.post("/submit")
async def submit_expense(
    amount: float = Form(...),
    description: str = Form(...),
    date: str = Form(...),
    receipt: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    """Submit expense claim (interns only)"""
    
    if current_user['role'] not in ['intern']:
        raise HTTPException(status_code=403, detail="Only interns can submit expenses")
    
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    
    # Upload receipt if provided
    receipt_url = None
    if receipt:
        file_content = await receipt.read()
        receipt_url = upload_file(file_content, receipt.filename, receipt.content_type)
    
    expense = expense_repo.create_expense(
        intern_id=current_user['user_id'],
        amount=amount,
        description=description,
        date_str=date,
        receipt_url=receipt_url
    )
    
    return expense


@router.get("/my-expenses")
async def get_my_expenses(current_user: dict = Depends(get_current_user)):
    """Get own expenses"""
    expenses = expense_repo.get_expenses_by_intern(current_user['user_id'])
    return expenses


@router.get("/intern/{intern_id}")
async def get_intern_expenses(
    intern_id: str,
    current_user: dict = Depends(require_manager)
):
    """Get expenses for a specific intern (managers/CEO only)"""
    expenses = expense_repo.get_expenses_by_intern(intern_id)
    
    # Get intern info
    intern = user_repo.get_user_by_id(intern_id)
    
    return {
        "intern": intern,
        "expenses": expenses
    }


@router.get("/all")
async def get_all_expenses(current_user: dict = Depends(require_manager)):
    """Get all expenses (managers/CEO only)"""
    expenses = expense_repo.get_all_expenses()
    
    # Enrich with intern info
    enriched_expenses = []
    for expense in expenses:
        intern = user_repo.get_user_by_id(expense['intern_id'])
        enriched_expenses.append({
            **expense,
            'intern_name': intern['name'] if intern else 'Unknown',
            'intern_email': intern['email'] if intern else 'Unknown'
        })
    
    return enriched_expenses


@router.post("/{expense_id}/review")
async def review_expense(
    expense_id: str,
    request: ExpenseReviewRequest,
    current_user: dict = Depends(require_manager)
):
    """Approve or reject an expense (managers/CEO only)"""
    
    if request.status not in ['approved', 'rejected']:
        raise HTTPException(status_code=400, detail="Status must be 'approved' or 'rejected'")
    
    # Verify expense exists
    expense = expense_repo.get_expense(expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    success = expense_repo.update_expense_status(
        expense_id=expense_id,
        status=request.status,
        reviewed_by=current_user['user_id'],
        review_notes=request.review_notes
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update expense")
    
    return {"success": True, "message": f"Expense {request.status}"}
@router.post("/{expense_id}/review")
async def review_expense(
    expense_id: str,
    request: ExpenseReviewRequest,
    current_user: dict = Depends(require_manager)
):
    """Approve or reject an expense (managers/CEO only)"""
    
    if request.status not in ['approved', 'rejected']:
        raise HTTPException(status_code=400, detail="Status must be 'approved' or 'rejected'")
    
    # Verify expense exists
    expense = expense_repo.get_expense(expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    success = expense_repo.update_expense_status(
        expense_id=expense_id,
        status=request.status,
        reviewed_by=current_user['user_id'],
        review_notes=request.review_notes
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update expense")
    
    # AUTO-RECALCULATE STIPEND WHEN EXPENSE IS APPROVED
    if request.status == 'approved':
        from app.services.stipend_service import calculate_stipend_for_intern
        
        try:
            current_month = expense['date'][:7]  # YYYY-MM format
            calculate_stipend_for_intern(expense['intern_id'], current_month)
            print(f"[AUTO-STIPEND] Updated stipend after expense approval for month {current_month}")
        except Exception as e:
            print(f"[AUTO-STIPEND] Failed to update stipend: {e}")
    
    return {"success": True, "message": f"Expense {request.status}"}
    
