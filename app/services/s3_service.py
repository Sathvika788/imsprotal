import boto3
from botocore.exceptions import ClientError
from app.core.config import settings
import uuid
import mimetypes

s3_client = boto3.client(
    's3',
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_REGION
)

ALLOWED_EXTENSIONS = {
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def upload_file(file_content: bytes, filename: str, content_type: str) -> str:
    """Upload file to S3 and return public URL"""
    
    # Validate content type
    if content_type not in ALLOWED_EXTENSIONS:
        raise ValueError(f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}")
    
    # Validate file size
    if len(file_content) > MAX_FILE_SIZE:
        raise ValueError(f"File too large. Maximum size: {MAX_FILE_SIZE / 1024 / 1024}MB")
    
    # Generate unique filename
    ext = mimetypes.guess_extension(content_type) or ''
    unique_filename = f"{uuid.uuid4()}{ext}"
    
    try:
        # Upload to S3 - bucket policy makes files public
        s3_client.put_object(
            Bucket=settings.S3_BUCKET_NAME,
            Key=unique_filename,
            Body=file_content,
            ContentType=content_type
            # ACL removed - bucket policy handles public access
        )
        
        # Return public URL
        url = f"https://{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{unique_filename}"
        return url
        
    except ClientError as e:
        raise Exception(f"Failed to upload file: {str(e)}")


def generate_presigned_url(file_key: str, expiration: int = 3600) -> str:
    """
    Generate a presigned URL for private files
    This is an alternative method if you don't want public files
    """
    try:
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': settings.S3_BUCKET_NAME,
                'Key': file_key
            },
            ExpiresIn=expiration  # URL expires in 1 hour by default
        )
        return url
    except ClientError as e:
        raise Exception(f"Failed to generate presigned URL: {str(e)}")