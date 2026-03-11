from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.security import get_current_user, require_manager, require_ceo
from app.db.dynamo import stipend_repo, user_repo
from app.services.stipend_service import calculate_stipend_for_intern, calculate_stipend_for_all_interns

router = APIRouter(prefix="/stipends", tags=["stipends"])


class StipendAdjustRequest(BaseModel):
    bonus: float
    penalty: float


class StipendCalculateRequest(BaseModel):
    intern_id: str
    month: str


class StipendCalculateAllRequest(BaseModel):
    month: str


class MarkPaidRequest(BaseModel):
    paid: bool


@router.get("/my-stipends")
async def get_my_stipends(current_user: dict = Depends(get_current_user)):
    """Get own stipends"""
    stipends = stipend_repo.get_stipends_by_intern(current_user['user_id'])
    return stipends


@router.get("/intern/{intern_id}")
async def get_intern_stipends(
    intern_id: str,
    current_user: dict = Depends(require_manager)
):
    """Get stipends for a specific intern (managers/CEO only)"""
    stipends = stipend_repo.get_stipends_by_intern(intern_id)
    
    # Get intern info
    intern = user_repo.get_user_by_id(intern_id)
    
    return {
        "intern": intern,
        "stipends": stipends
    }


@router.get("/month/{month}")
async def get_stipends_for_month(
    month: str,
    current_user: dict = Depends(require_ceo)
):
    """Get all stipends for a month (CEO only)"""
    stipends = stipend_repo.get_all_stipends_for_month(month)
    
    # Enrich with intern info
    enriched_stipends = []
    for stipend in stipends:
        intern = user_repo.get_user_by_id(stipend['intern_id'])
        enriched_stipends.append({
            **stipend,
            'intern_name': intern['name'] if intern else 'Unknown',
            'intern_email': intern['email'] if intern else 'Unknown'
        })
    
    return enriched_stipends


@router.post("/calculate")
async def calculate_stipend(
    request: StipendCalculateRequest,
    current_user: dict = Depends(require_manager)
):
    """Calculate stipend for a single intern (managers/CEO only)"""
    
    # Verify intern exists
    intern = user_repo.get_user_by_id(request.intern_id)
    if not intern or intern['role'] != 'intern':
        raise HTTPException(status_code=404, detail="Intern not found")
    
    try:
        stipend = calculate_stipend_for_intern(request.intern_id, request.month)
        return stipend
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/calculate-all")
async def calculate_all_stipends(
    request: StipendCalculateAllRequest,
    current_user: dict = Depends(require_ceo)
):
    """Calculate stipends for all interns (CEO only)"""
    
    try:
        results = calculate_stipend_for_all_interns(request.month)
        return {
            "total": len(results),
            "successful": len([r for r in results if r['success']]),
            "failed": len([r for r in results if not r['success']]),
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{intern_id}/{month}/adjust")
async def adjust_stipend(
    intern_id: str,
    month: str,
    request: StipendAdjustRequest,
    current_user: dict = Depends(require_manager)
):
    """Adjust bonus/penalty for a stipend (managers/CEO only)"""
    
    # Verify stipend exists
    stipend = stipend_repo.get_stipend(intern_id, month)
    if not stipend:
        raise HTTPException(status_code=404, detail="Stipend not found")
    
    success = stipend_repo.update_stipend_adjustments(
        intern_id=intern_id,
        month=month,
        bonus=request.bonus,
        penalty=request.penalty
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update stipend")
    
    return {"success": True, "message": "Stipend adjusted"}


@router.patch("/{intern_id}/{month}/mark-paid")
async def mark_stipend_paid(
    intern_id: str,
    month: str,
    request: MarkPaidRequest,
    current_user: dict = Depends(require_ceo)
):
    """Mark stipend as paid (CEO only)"""
    
    # Verify stipend exists
    stipend = stipend_repo.get_stipend(intern_id, month)
    if not stipend:
        raise HTTPException(status_code=404, detail="Stipend not found")
    
    success = stipend_repo.mark_stipend_paid(
        intern_id=intern_id,
        month=month,
        paid=request.paid
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update stipend")
    
    return {"success": True, "message": f"Stipend marked as {'paid' if request.paid else 'unpaid'}"}


@router.get("/test-auto-calc/{intern_id}")
async def test_auto_calc(
    intern_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Test endpoint to force calculate and return stipend"""
    from datetime import datetime
    
    current_month = datetime.now().strftime('%Y-%m')
    
    try:
        stipend = calculate_stipend_for_intern(intern_id, current_month)
        return {
            "success": True,
            "message": "Stipend calculated successfully",
            "stipend": stipend,
            "month": current_month
        }
    except Exception as e:
        import traceback
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }

@router.get("/all-stipends")
async def get_all_stipends(current_user: dict = Depends(require_manager)):
    """Get all stipends for all interns (managers/CEO only)"""
    all_stipends = []
    
    # Get all interns
    interns = user_repo.get_users_by_role('intern')
    
    for intern in interns:
        stipends = stipend_repo.get_stipends_by_intern(intern['id'])
        for stipend in stipends:
            all_stipends.append({
                **stipend,
                'intern_name': intern['name'],
                'intern_email': intern['email']
            })
    
    # Sort by month descending
    all_stipends.sort(key=lambda x: x['month'], reverse=True)
    
    return all_stipends