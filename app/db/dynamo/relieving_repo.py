from typing import Optional
import uuid
from datetime import datetime
from app.db.dynamo.client import dynamodb
from botocore.exceptions import ClientError

TABLE_NAME = "IMS"


def create_relieving(
    intern_id: str,
    reason: str,
    last_working_day: str,
    notice_period_days: int = 30
) -> dict:
    """Create a relieving request"""
    relieving_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()
    
    item = {
        'PK': {'S': f'RELIEVING#{relieving_id}'},
        'SK': {'S': 'RELIEVING'},
        'GSI1PK': {'S': f'INTERN_RELIEVING#{intern_id}'},
        'GSI1SK': {'S': f'DATE#{timestamp}'},
        'id': {'S': relieving_id},
        'intern_id': {'S': intern_id},
        'reason': {'S': reason},
        'last_working_day': {'S': last_working_day},
        'notice_period_days': {'N': str(notice_period_days)},
        'status': {'S': 'pending'},
        'created_at': {'S': timestamp}
    }
    
    try:
        dynamodb.put_item(TableName=TABLE_NAME, Item=item)
        
        return {
            'id': relieving_id,
            'intern_id': intern_id,
            'reason': reason,
            'last_working_day': last_working_day,
            'notice_period_days': notice_period_days,
            'status': 'pending',
            'created_at': timestamp
        }
    except ClientError:
        raise


def get_relieving(relieving_id: str) -> Optional[dict]:
    """Get relieving by ID"""
    try:
        response = dynamodb.get_item(
            TableName=TABLE_NAME,
            Key={'PK': {'S': f'RELIEVING#{relieving_id}'}, 'SK': {'S': 'RELIEVING'}}
        )
        
        if 'Item' not in response:
            return None
        
        item = response['Item']
        result = {
            'id': item['id']['S'],
            'intern_id': item['intern_id']['S'],
            'reason': item['reason']['S'],
            'last_working_day': item['last_working_day']['S'],
            'notice_period_days': int(item['notice_period_days']['N']),
            'status': item['status']['S'],
            'created_at': item['created_at']['S']
        }
        
        if 'reviewed_by' in item:
            result['reviewed_by'] = item['reviewed_by']['S']
        if 'reviewed_at' in item:
            result['reviewed_at'] = item['reviewed_at']['S']
        if 'review_notes' in item:
            result['review_notes'] = item['review_notes']['S']
        
        return result
    except ClientError:
        return None


def get_relievings_by_intern(intern_id: str) -> list:
    """Get all relievings for an intern"""
    try:
        response = dynamodb.query(
            TableName=TABLE_NAME,
            IndexName='GSI1',
            KeyConditionExpression='GSI1PK = :intern',
            ExpressionAttributeValues={':intern': {'S': f'INTERN_RELIEVING#{intern_id}'}}
        )
        
        relievings = []
        for item in response.get('Items', []):
            relieving = {
                'id': item['id']['S'],
                'intern_id': item['intern_id']['S'],
                'reason': item['reason']['S'],
                'last_working_day': item['last_working_day']['S'],
                'notice_period_days': int(item['notice_period_days']['N']),
                'status': item['status']['S'],
                'created_at': item['created_at']['S']
            }
            
            if 'reviewed_by' in item:
                relieving['reviewed_by'] = item['reviewed_by']['S']
            if 'reviewed_at' in item:
                relieving['reviewed_at'] = item['reviewed_at']['S']
            if 'review_notes' in item:
                relieving['review_notes'] = item['review_notes']['S']
            
            relievings.append(relieving)
        
        return sorted(relievings, key=lambda x: x['created_at'], reverse=True)
    except ClientError:
        return []


def get_all_relievings() -> list:
    """Get all relievings"""
    try:
        response = dynamodb.scan(
            TableName=TABLE_NAME,
            FilterExpression='begins_with(PK, :prefix)',
            ExpressionAttributeValues={':prefix': {'S': 'RELIEVING#'}}
        )
        
        relievings = []
        for item in response.get('Items', []):
            relieving = {
                'id': item['id']['S'],
                'intern_id': item['intern_id']['S'],
                'reason': item['reason']['S'],
                'last_working_day': item['last_working_day']['S'],
                'notice_period_days': int(item['notice_period_days']['N']),
                'status': item['status']['S'],
                'created_at': item['created_at']['S']
            }
            
            if 'reviewed_by' in item:
                relieving['reviewed_by'] = item['reviewed_by']['S']
            if 'reviewed_at' in item:
                relieving['reviewed_at'] = item['reviewed_at']['S']
            if 'review_notes' in item:
                relieving['review_notes'] = item['review_notes']['S']
            
            relievings.append(relieving)
        
        return sorted(relievings, key=lambda x: x['created_at'], reverse=True)
    except ClientError:
        return []


def update_relieving_status(
    relieving_id: str,
    status: str,
    reviewed_by: str,
    review_notes: Optional[str] = None
) -> bool:
    """Update relieving status"""
    try:
        timestamp = datetime.utcnow().isoformat()
        
        update_expr = 'SET #status = :status, reviewed_by = :reviewed_by, reviewed_at = :reviewed_at'
        expr_values = {
            ':status': {'S': status},
            ':reviewed_by': {'S': reviewed_by},
            ':reviewed_at': {'S': timestamp}
        }
        
        if review_notes:
            update_expr += ', review_notes = :notes'
            expr_values[':notes'] = {'S': review_notes}
        
        dynamodb.update_item(
            TableName=TABLE_NAME,
            Key={'PK': {'S': f'RELIEVING#{relieving_id}'}, 'SK': {'S': 'RELIEVING'}},
            UpdateExpression=update_expr,
            ExpressionAttributeValues=expr_values,
            ExpressionAttributeNames={'#status': 'status'}
        )
        
        return True
    except ClientError:
        return False
