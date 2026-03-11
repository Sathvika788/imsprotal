from datetime import datetime
from app.db.dynamo import attendance_repo, expense_repo, stipend_repo, user_repo
from app.core.config import settings
from app.services.email_service import send_stipend_calculated_email


def calculate_stipend_for_intern(intern_id: str, month: str) -> dict:
    """Calculate stipend for a single intern for a month"""
    
    print(f"\n{'='*60}")
    print(f"[STIPEND-CALC] Starting calculation")
    print(f"[STIPEND-CALC] Intern ID: {intern_id}")
    print(f"[STIPEND-CALC] Month: {month}")
    print(f"{'='*60}")
    
    # Get existing stipend to preserve bonus/penalty
    existing_stipend = stipend_repo.get_stipend(intern_id, month)
    bonus = existing_stipend['bonus'] if existing_stipend else 0.0
    penalty = existing_stipend['penalty'] if existing_stipend else 0.0
    
    print(f"[STIPEND-CALC] Existing bonus: ₹{bonus}")
    print(f"[STIPEND-CALC] Existing penalty: ₹{penalty}")
    
    # Count attendance
    attendance_counts = attendance_repo.count_attendance_by_status(intern_id, month)
    days_present = attendance_counts['present'] + attendance_counts['late']
    
    print(f"[STIPEND-CALC] Attendance counts: {attendance_counts}")
    print(f"[STIPEND-CALC] Days present (present + late): {days_present}")
    
    # Calculate base amount
    daily_rate = settings.DEFAULT_DAILY_RATE
    base_amount = days_present * daily_rate
    
    print(f"[STIPEND-CALC] Daily rate: ₹{daily_rate}")
    print(f"[STIPEND-CALC] Base amount: {days_present} × ₹{daily_rate} = ₹{base_amount}")
    
    # Get approved expenses
    approved_expenses = expense_repo.get_approved_expenses_total(intern_id, month)
    
    print(f"[STIPEND-CALC] Approved expenses: ₹{approved_expenses}")
    
    # Calculate total
    total_amount = base_amount + approved_expenses + bonus - penalty
    
    print(f"[STIPEND-CALC] Total calculation:")
    print(f"[STIPEND-CALC]   Base: ₹{base_amount}")
    print(f"[STIPEND-CALC]   + Expenses: ₹{approved_expenses}")
    print(f"[STIPEND-CALC]   + Bonus: ₹{bonus}")
    print(f"[STIPEND-CALC]   - Penalty: ₹{penalty}")
    print(f"[STIPEND-CALC]   = TOTAL: ₹{total_amount}")
    
    # Save stipend
    stipend = stipend_repo.create_or_update_stipend(
        intern_id=intern_id,
        month=month,
        base_amount=base_amount,
        approved_expenses=approved_expenses,
        bonus=bonus,
        penalty=penalty,
        total_amount=total_amount,
        days_present=days_present,
        daily_rate=daily_rate
    )
    
    print(f"[STIPEND-CALC] ✓ Stipend saved to database")
    
    # Send email notification
    user = user_repo.get_user_by_id(intern_id)
    if user:
        print(f"[STIPEND-CALC] Sending email to {user['email']}")
        send_stipend_calculated_email(user['email'], user['name'], month, total_amount)
        print(f"[STIPEND-CALC] ✓ Email sent")
    else:
        print(f"[STIPEND-CALC] ✗ User not found, email not sent")
    
    print(f"{'='*60}\n")
    
    return stipend

def calculate_stipend_for_all_interns(month: str) -> list:
    """Calculate stipend for all interns for a month"""
    
    # Get all interns
    interns = user_repo.get_users_by_role('intern')
    
    results = []
    for intern in interns:
        try:
            stipend = calculate_stipend_for_intern(intern['id'], month)
            results.append({
                'intern_id': intern['id'],
                'intern_name': intern['name'],
                'success': True,
                'stipend': stipend
            })
        except Exception as e:
            results.append({
                'intern_id': intern['id'],
                'intern_name': intern['name'],
                'success': False,
                'error': str(e)
            })
    
    return results
