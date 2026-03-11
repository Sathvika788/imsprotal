from typing import Optional
import uuid
from datetime import datetime, date
from app.db.dynamo.client import dynamodb
from botocore.exceptions import ClientError

TABLE_NAME = "IMS"


def create_log(intern_id: str, date_str: str, content: str, proof_url: Optional[str] = None) -> dict:
    """Create a daily work log"""
    log_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()
    
    item = {
        'PK': {'S': f'LOG#{intern_id}'},
        'SK': {'S': f'DATE#{date_str}#ID#{log_id}'},
        'GSI1PK': {'S': f'LOG_DATE#{date_str}'},
        'GSI1SK': {'S': f'INTERN#{intern_id}'},
        'id': {'S': log_id},
        'intern_id': {'S': intern_id},
        'date': {'S': date_str},
        'content': {'S': content},
        'status': {'S': 'pending'},
        'created_at': {'S': timestamp}
    }
    
    if proof_url:
        item['proof_url'] = {'S': proof_url}
    
    try:
        dynamodb.put_item(TableName=TABLE_NAME, Item=item)
        
        result = {
            'id': log_id,
            'intern_id': intern_id,
            'date': date_str,
            'content': content,
            'status': 'pending',
            'created_at': timestamp
        }
        
        if proof_url:
            result['proof_url'] = proof_url
        
        return result
    except ClientError:
        raise


def get_log_by_intern_and_date(intern_id: str, date_str: str) -> Optional[dict]:
    """Get log for a specific intern on a specific date"""
    try:
        response = dynamodb.query(
            TableName=TABLE_NAME,
            KeyConditionExpression='PK = :pk AND begins_with(SK, :sk_prefix)',
            ExpressionAttributeValues={
                ':pk': {'S': f'LOG#{intern_id}'},
                ':sk_prefix': {'S': f'DATE#{date_str}#'}
            }
        )
        
        items = response.get('Items', [])
        if not items:
            return None
        
        item = items[0]
        result = {
            'id': item['id']['S'],
            'intern_id': item['intern_id']['S'],
            'date': item['date']['S'],
            'content': item['content']['S'],
            'status': item['status']['S'],
            'created_at': item['created_at']['S']
        }
        
        if 'proof_url' in item:
            result['proof_url'] = item['proof_url']['S']
        if 'verified_by' in item:
            result['verified_by'] = item['verified_by']['S']
        if 'verified_at' in item:
            result['verified_at'] = item['verified_at']['S']
        if 'comment' in item:
            result['comment'] = item['comment']['S']
        
        return result
    except ClientError:
        return None


def get_logs_by_intern(intern_id: str, limit: int = 50) -> list:
    """Get all logs for an intern"""
    try:
        response = dynamodb.query(
            TableName=TABLE_NAME,
            KeyConditionExpression='PK = :pk',
            ExpressionAttributeValues={':pk': {'S': f'LOG#{intern_id}'}},
            ScanIndexForward=False,
            Limit=limit
        )
        
        logs = []
        for item in response.get('Items', []):
            log = {
                'id': item['id']['S'],
                'intern_id': item['intern_id']['S'],
                'date': item['date']['S'],
                'content': item['content']['S'],
                'status': item['status']['S'],
                'created_at': item['created_at']['S']
            }
            
            if 'proof_url' in item:
                log['proof_url'] = item['proof_url']['S']
            if 'verified_by' in item:
                log['verified_by'] = item['verified_by']['S']
            if 'verified_at' in item:
                log['verified_at'] = item['verified_at']['S']
            if 'comment' in item:
                log['comment'] = item['comment']['S']
            
            logs.append(log)
        
        return logs
    except ClientError:
        return []


def get_logs_by_date(date_str: str) -> list:
    """Get all logs for a specific date"""
    try:
        response = dynamodb.query(
            TableName=TABLE_NAME,
            IndexName='GSI1',
            KeyConditionExpression='GSI1PK = :date',
            ExpressionAttributeValues={':date': {'S': f'LOG_DATE#{date_str}'}}
        )
        
        logs = []
        for item in response.get('Items', []):
            log = {
                'id': item['id']['S'],
                'intern_id': item['intern_id']['S'],
                'date': item['date']['S'],
                'content': item['content']['S'],
                'status': item['status']['S'],
                'created_at': item['created_at']['S']
            }
            
            if 'proof_url' in item:
                log['proof_url'] = item['proof_url']['S']
            if 'verified_by' in item:
                log['verified_by'] = item['verified_by']['S']
            if 'verified_at' in item:
                log['verified_at'] = item['verified_at']['S']
            if 'comment' in item:
                log['comment'] = item['comment']['S']
            
            logs.append(log)
        
        return logs
    except ClientError:
        return []


def update_log_status(intern_id: str, log_id: str, date_str: str, status: str, verified_by: str, comment: Optional[str] = None) -> bool:
    """Update log status (verify/reject)"""
    try:
        timestamp = datetime.utcnow().isoformat()
        
        update_expr = 'SET #status = :status, verified_by = :verified_by, verified_at = :verified_at'
        expr_values = {
            ':status': {'S': status},
            ':verified_by': {'S': verified_by},
            ':verified_at': {'S': timestamp}
        }
        
        if comment:
            update_expr += ', comment = :comment'
            expr_values[':comment'] = {'S': comment}
        
        dynamodb.update_item(
            TableName=TABLE_NAME,
            Key={
                'PK': {'S': f'LOG#{intern_id}'},
                'SK': {'S': f'DATE#{date_str}#ID#{log_id}'}
            },
            UpdateExpression=update_expr,
            ExpressionAttributeValues=expr_values,
            ExpressionAttributeNames={'#status': 'status'}
        )
        
        return True
    except ClientError:
        return False
