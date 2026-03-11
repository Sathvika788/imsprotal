import boto3
from botocore.exceptions import ClientError
from app.core.config import settings

ses_client = boto3.client(
    'ses',
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_REGION
)


def send_email(to_email: str, subject: str, body_html: str) -> bool:
    """Send email via AWS SES"""
    try:
        response = ses_client.send_email(
            Source=settings.SES_SENDER_EMAIL,
            Destination={'ToAddresses': [to_email]},
            Message={
                'Subject': {'Data': subject, 'Charset': 'UTF-8'},
                'Body': {'Html': {'Data': body_html, 'Charset': 'UTF-8'}}
            }
        )
        return True
    except ClientError as e:
        print(f"[SES] Failed to send email to {to_email}: {e}")
        return False


def send_stipend_calculated_email(intern_email: str, intern_name: str, month: str, total_amount: float):
    """Send stipend calculation notification"""
    subject = f"Stipend Calculated for {month}"
    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #00d4aa;">Stipend Calculated</h2>
        <p>Hello {intern_name},</p>
        <p>Your stipend for <strong>{month}</strong> has been calculated.</p>
        <p><strong>Total Amount: ₹{total_amount:.2f}</strong></p>
        <p>Please log in to the Intern Management System to view the breakdown.</p>
        <br>
        <p>Best regards,<br>IMS Team</p>
    </body>
    </html>
    """
    return send_email(intern_email, subject, body)


def send_daily_reminder_email(intern_email: str, intern_name: str):
    """Send daily work log reminder"""
    subject = "Reminder: Submit Your Daily Work Log"
    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #f97316;">Daily Log Reminder</h2>
        <p>Hello {intern_name},</p>
        <p>You haven't submitted your daily work log yet for today.</p>
        <p>Please log in and submit your work log before the end of the day.</p>
        <p><a href="{settings.FRONTEND_URL}/intern/logs" style="background: #00d4aa; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Submit Log</a></p>
        <br>
        <p>Best regards,<br>IMS Team</p>
    </body>
    </html>
    """
    return send_email(intern_email, subject, body)


def send_password_reset_email(user_email: str, user_name: str, reset_link: str):
    """Send password reset link via email"""
    subject = "Reset Your Password - IMS"
    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f8f9fa;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #20B2AA; margin-bottom: 20px;">Password Reset Request</h2>
            
            <p>Hello {user_name},</p>
            
            <p>We received a request to reset the password for your Intern Management System account.</p>
            
            <p>Click the link below to reset your password. This link is valid for <strong>24 hours</strong>.</p>
            
            <p style="margin: 30px 0;">
                <a href="{reset_link}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
                    Reset Password
                </a>
            </p>
            
            <p>Or copy this link in your browser: <br><code style="background-color: #f0f0f0; padding: 10px; border-radius: 3px; display: inline-block; word-break: break-all;">{reset_link}</code></p>
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            
            <p style="color: #666; font-size: 14px;">If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
            
            <p style="color: #999; font-size: 12px; margin-top: 20px;">
                Best regards,<br>
                <strong>Intern Management System Team</strong>
            </p>
        </div>
    </body>
    </html>
    """
    return send_email(user_email, subject, body)
