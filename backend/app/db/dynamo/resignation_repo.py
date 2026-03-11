from typing import Optional
import uuid
from datetime import datetime
from app.db.dynamo.client import dynamodb
from botocore.exceptions import ClientError

TABLE_NAME = "IMS"


def create_resignation(
    intern_id: str,
    reason: str,
    last_working_day: str,
    notice_period_days: int = 30
) -> dict:
    """Create a resignation request"""
    resignation_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()
    
    item = {
        'PK': {'S': f'RESIGNATION#{resignation_id}'},
        'SK': {'S': 'RESIGNATION'},
        'GSI1PK': {'S': f'INTERN_RESIGNATION#{intern_id}'},
        'GSI1SK': {'S': f'DATE#{timestamp}'},
        'id': {'S': resignation_id},
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
            'id': resignation_id,
            'intern_id': intern_id,
            'reason': reason,
            'last_working_day': last_working_day,
            'notice_period_days': notice_period_days,
            'status': 'pending',
            'created_at': timestamp
        }
    except ClientError:
        raise


def get_resignation(resignation_id: str) -> Optional[dict]:
    """Get resignation by ID"""
    try:
        response = dynamodb.get_item(
            TableName=TABLE_NAME,
            Key={'PK': {'S': f'RESIGNATION#{resignation_id}'}, 'SK': {'S': 'RESIGNATION'}}
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


def get_resignations_by_intern(intern_id: str) -> list:
    """Get all resignations for an intern"""
    try:
        response = dynamodb.query(
            TableName=TABLE_NAME,
            IndexName='GSI1',
            KeyConditionExpression='GSI1PK = :intern',
            ExpressionAttributeValues={':intern': {'S': f'INTERN_RESIGNATION#{intern_id}'}}
        )
        
        resignations = []
        for item in response.get('Items', []):
            resignation = {
                'id': item['id']['S'],
                'intern_id': item['intern_id']['S'],
                'reason': item['reason']['S'],
                'last_working_day': item['last_working_day']['S'],
                'notice_period_days': int(item['notice_period_days']['N']),
                'status': item['status']['S'],
                'created_at': item['created_at']['S']
            }
            
            if 'reviewed_by' in item:
                resignation['reviewed_by'] = item['reviewed_by']['S']
            if 'reviewed_at' in item:
                resignation['reviewed_at'] = item['reviewed_at']['S']
            if 'review_notes' in item:
                resignation['review_notes'] = item['review_notes']['S']
            
            resignations.append(resignation)
        
        return sorted(resignations, key=lambda x: x['created_at'], reverse=True)
    except ClientError:
        return []


def get_all_resignations() -> list:
    """Get all resignations"""
    try:
        response = dynamodb.scan(
            TableName=TABLE_NAME,
            FilterExpression='begins_with(PK, :prefix)',
            ExpressionAttributeValues={':prefix': {'S': 'RESIGNATION#'}}
        )
        
        resignations = []
        for item in response.get('Items', []):
            resignation = {
                'id': item['id']['S'],
                'intern_id': item['intern_id']['S'],
                'reason': item['reason']['S'],
                'last_working_day': item['last_working_day']['S'],
                'notice_period_days': int(item['notice_period_days']['N']),
                'status': item['status']['S'],
                'created_at': item['created_at']['S']
            }
            
            if 'reviewed_by' in item:
                resignation['reviewed_by'] = item['reviewed_by']['S']
            if 'reviewed_at' in item:
                resignation['reviewed_at'] = item['reviewed_at']['S']
            if 'review_notes' in item:
                resignation['review_notes'] = item['review_notes']['S']
            
            resignations.append(resignation)
        
        return sorted(resignations, key=lambda x: x['created_at'], reverse=True)
    except ClientError:
        return []


def update_resignation_status(
    resignation_id: str,
    status: str,
    reviewed_by: str,
    review_notes: Optional[str] = None
) -> bool:
    """Update resignation status"""
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
            Key={'PK': {'S': f'RESIGNATION#{resignation_id}'}, 'SK': {'S': 'RESIGNATION'}},
            UpdateExpression=update_expr,
            ExpressionAttributeValues=expr_values,
            ExpressionAttributeNames={'#status': 'status'}
        )
        
        return True
    except ClientError:
        return False