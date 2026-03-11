import boto3
from botocore.exceptions import ClientError
from app.core.config import settings
import time

# Initialize DynamoDB client
dynamodb = boto3.client(
    'dynamodb',
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_REGION,
    endpoint_url=settings.DYNAMODB_ENDPOINT_URL if settings.DYNAMODB_ENDPOINT_URL else None
)


def bootstrap_table():
    """Create the IMS table with GSI if it doesn't exist"""
    table_name = "IMS"
    
    try:
        # Check if table exists
        dynamodb.describe_table(TableName=table_name)
        print(f"[DynamoDB] Table '{table_name}' already exists ✓")
        return
    except ClientError as e:
        if e.response['Error']['Code'] != 'ResourceNotFoundException':
            raise
    
    # Create table
    print(f"[DynamoDB] Creating table '{table_name}'...")
    
    try:
        dynamodb.create_table(
            TableName=table_name,
            KeySchema=[
                {'AttributeName': 'PK', 'KeyType': 'HASH'},
                {'AttributeName': 'SK', 'KeyType': 'RANGE'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'PK', 'AttributeType': 'S'},
                {'AttributeName': 'SK', 'AttributeType': 'S'},
                {'AttributeName': 'GSI1PK', 'AttributeType': 'S'},
                {'AttributeName': 'GSI1SK', 'AttributeType': 'S'}
            ],
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'GSI1',
                    'KeySchema': [
                        {'AttributeName': 'GSI1PK', 'KeyType': 'HASH'},
                        {'AttributeName': 'GSI1SK', 'KeyType': 'RANGE'}
                    ],
                    'Projection': {'ProjectionType': 'ALL'}
                }
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        
        # Wait for table to be active
        waiter = dynamodb.get_waiter('table_exists')
        waiter.wait(TableName=table_name, WaiterConfig={'Delay': 2, 'MaxAttempts': 30})
        
        # Additional wait for GSI to be active
        time.sleep(5)
        
        print(f"[DynamoDB] Table '{table_name}' created and ready ✓")
        
    except ClientError as e:
        print(f"[DynamoDB] Error creating table: {e}")
        raise
