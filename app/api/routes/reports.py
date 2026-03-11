from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from datetime import datetime, timedelta

from app.core.security import require_manager
from app.services.report_service import (
    generate_daily_report,
    generate_weekly_report,
    generate_monthly_report
)

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/daily/{date}")
async def download_daily_report(
    date: str,
    current_user: dict = Depends(require_manager)
):
    """Download daily report as Excel (managers/CEO only)"""
    try:
        # Validate date format
        datetime.strptime(date, '%Y-%m-%d')
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    try:
        excel_file = generate_daily_report(date)
        
        return StreamingResponse(
            excel_file,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename=daily_report_{date}.xlsx"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")


@router.get("/weekly/{start_date}/{end_date}")
async def download_weekly_report(
    start_date: str,
    end_date: str,
    current_user: dict = Depends(require_manager)
):
    """Download weekly report as Excel (managers/CEO only)"""
    try:
        datetime.strptime(start_date, '%Y-%m-%d')
        datetime.strptime(end_date, '%Y-%m-%d')
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    try:
        excel_file = generate_weekly_report(start_date, end_date)
        
        return StreamingResponse(
            excel_file,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename=weekly_report_{start_date}_to_{end_date}.xlsx"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")


@router.get("/monthly/{month}")
async def download_monthly_report(
    month: str,
    current_user: dict = Depends(require_manager)
):
    """Download monthly report as Excel (managers/CEO only)"""
    try:
        datetime.strptime(month + '-01', '%Y-%m-%d')
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY-MM")
    
    try:
        excel_file = generate_monthly_report(month)
        
        return StreamingResponse(
            excel_file,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename=monthly_report_{month}.xlsx"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")