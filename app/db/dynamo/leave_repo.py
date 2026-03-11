from typing import Optional
import uuid
from datetime import datetime
from app.db.dynamo.client import dynamodb
from botocore.exceptions import ClientError

TABLE_NAME = "IMS"


def create_leave_request(intern_id: str, start_date: str, end_date: str, reason: str, leave_type: str) -> dict:
    """Create a leave request"""
    leave_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()
    
    item = {
        'PK': {'S': f'LEAVE#{leave_id}'},
        'SK': {'S': 'LEAVE'},
        'GSI1PK': {'S': f'INTERN_LEAVES#{intern_id}'},
        'GSI1SK': {'S': f'STATUS#pending#LEAVE#{leave_id}'},
        'id': {'S': leave_id},
        'intern_id': {'S': intern_id},
        'start_date': {'S': start_date},
        'end_date': {'S': end_date},
        'reason': {'S': reason},
        'leave_type': {'S': leave_type},
        'status': {'S': 'pending'},
        'created_at': {'S': timestamp}
    }
    
    try:
        dynamodb.put_item(TableName=TABLE_NAME, Item=item)
        
        return {
            'id': leave_id,
            'intern_id': intern_id,
            'start_date': start_date,
            'end_date': end_date,
            'reason': reason,
            'leave_type': leave_type,
            'status': 'pending',
            'created_at': timestamp
        }
    except ClientError:
        raise


def get_leave_request(leave_id: str) -> Optional[dict]:
    """Get leave request by ID"""
    try:
        response = dynamodb.get_item(
            TableName=TABLE_NAME,
            Key={'PK': {'S': f'LEAVE#{leave_id}'}, 'SK': {'S': 'LEAVE'}}
        )
        
        if 'Item' not in response:
            return None
        
        item = response['Item']
        result = {
            'id': item['id']['S'],
            'intern_id': item['intern_id']['S'],
            'start_date': item['start_date']['S'],
            'end_date': item['end_date']['S'],
            'reason': item['reason']['S'],
            'leave_type': item['leave_type']['S'],
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


def get_leaves_by_intern(intern_id: str) -> list:
    """Get all leave requests for an intern"""
    try:
        response = dynamodb.query(
            TableName=TABLE_NAME,
            IndexName='GSI1',
            KeyConditionExpression='GSI1PK = :intern',
            ExpressionAttributeValues={':intern': {'S': f'INTERN_LEAVES#{intern_id}'}}
        )
        
        leaves = []
        for item in response.get('Items', []):
            leave = {
                'id': item['id']['S'],
                'intern_id': item['intern_id']['S'],
                'start_date': item['start_date']['S'],
                'end_date': item['end_date']['S'],
                'reason': item['reason']['S'],
                'leave_type': item['leave_type']['S'],
                'status': item['status']['S'],
                'created_at': item['created_at']['S']
            }
            
            if 'reviewed_by' in item:
                leave['reviewed_by'] = item['reviewed_by']['S']
            if 'reviewed_at' in item:
                leave['reviewed_at'] = item['reviewed_at']['S']
            if 'review_notes' in item:
                leave['review_notes'] = item['review_notes']['S']
            
            leaves.append(leave)
        
        return sorted(leaves, key=lambda x: x['created_at'], reverse=True)
    except ClientError:
        return []


def get_all_leave_requests() -> list:
    """Get all leave requests"""
    try:
        response = dynamodb.scan(
            TableName=TABLE_NAME,
            FilterExpression='begins_with(PK, :prefix)',
            ExpressionAttributeValues={':prefix': {'S': 'LEAVE#'}}
        )
        
        leaves = []
        for item in response.get('Items', []):
            leave = {
                'id': item['id']['S'],
                'intern_id': item['intern_id']['S'],
                'start_date': item['start_date']['S'],
                'end_date': item['end_date']['S'],
                'reason': item['reason']['S'],
                'leave_type': item['leave_type']['S'],
                'status': item['status']['S'],
                'created_at': item['created_at']['S']
            }
            
            if 'reviewed_by' in item:
                leave['reviewed_by'] = item['reviewed_by']['S']
            if 'reviewed_at' in item:
                leave['reviewed_at'] = item['reviewed_at']['S']
            if 'review_notes' in item:
                leave['review_notes'] = item['review_notes']['S']
            
            leaves.append(leave)
        
        return sorted(leaves, key=lambda x: x['created_at'], reverse=True)
    except ClientError:
        return []


def update_leave_status(leave_id: str, status: str, reviewed_by: str, review_notes: Optional[str] = None) -> bool:
    """Approve or reject leave request"""
    try:
        timestamp = datetime.utcnow().isoformat()
        
        # Get leave details first
        leave = get_leave_request(leave_id)
        if not leave:
            return False
        
        # Update GSI1SK to reflect new status
        new_gsi1sk = f'STATUS#{status}#LEAVE#{leave_id}'
        
        update_expr = 'SET #status = :status, GSI1SK = :gsi1sk, reviewed_by = :reviewed_by, reviewed_at = :reviewed_at'
        expr_values = {
            ':status': {'S': status},
            ':gsi1sk': {'S': new_gsi1sk},
            ':reviewed_by': {'S': reviewed_by},
            ':reviewed_at': {'S': timestamp}
        }
        
        if review_notes:
            update_expr += ', review_notes = :review_notes'
            expr_values[':review_notes'] = {'S': review_notes}
        
        dynamodb.update_item(
            TableName=TABLE_NAME,
            Key={'PK': {'S': f'LEAVE#{leave_id}'}, 'SK': {'S': 'LEAVE'}},
            UpdateExpression=update_expr,
            ExpressionAttributeValues=expr_values,
            ExpressionAttributeNames={'#status': 'status'}
        )
        
        return True
    except ClientError:
        return False