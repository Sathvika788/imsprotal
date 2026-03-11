from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, date
from app.db.dynamo import user_repo, log_repo
from app.services.email_service import send_daily_reminder_email


def send_daily_reminders():
    """Send reminders to interns who haven't submitted logs today"""
    today = date.today().isoformat()
    
    print(f"[Scheduler] Running daily reminders for {today}...")
    
    # Get all interns
    interns = user_repo.get_users_by_role('intern')
    
    sent_count = 0
    for intern in interns:
        # Check if intern has submitted log today
        log = log_repo.get_log_by_intern_and_date(intern['id'], today)
        
        if not log:
            # No log submitted, send reminder
            success = send_daily_reminder_email(intern['email'], intern['name'])
            if success:
                sent_count += 1
                print(f"[Scheduler] Reminder sent to {intern['name']} ({intern['email']})")
    
    print(f"[Scheduler] Sent {sent_count} reminders")


def start_scheduler():
    """Start the APScheduler background scheduler"""
    scheduler = BackgroundScheduler()
    
    # Schedule daily reminders Mon-Fri at 5:45 PM
    scheduler.add_job(
        send_daily_reminders,
        'cron',
        day_of_week='mon-fri',
        hour=17,
        minute=45,
        id='daily_reminders',
        replace_existing=True
    )
    
    scheduler.start()
    print("[Scheduler] Started — reminders at 5:45 PM weekdays ✓")
    
    return scheduler
