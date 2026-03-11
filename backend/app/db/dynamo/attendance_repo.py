from typing import Optional
from datetime import datetime
from app.db.dynamo.client import dynamodb
from botocore.exceptions import ClientError

TABLE_NAME = "IMS"


def mark_attendance(intern_id: str, date_str: str, status: str, marked_by: Optional[str] = None) -> dict:
    """Mark attendance for an intern"""
    timestamp = datetime.utcnow().isoformat()
    
    item = {
        'PK': {'S': f'ATTENDANCE#{intern_id}'},
        'SK': {'S': f'DATE#{date_str}'},
        'GSI1PK': {'S': f'ATT_DATE#{date_str}'},
        'GSI1SK': {'S': f'INTERN#{intern_id}'},
        'intern_id': {'S': intern_id},
        'date': {'S': date_str},
        'status': {'S': status},
        'created_at': {'S': timestamp}
    }
    
    if marked_by:
        item['marked_by'] = {'S': marked_by}
    
    try:
        dynamodb.put_item(TableName=TABLE_NAME, Item=item)
        
        result = {
            'intern_id': intern_id,
            'date': date_str,
            'status': status,
            'created_at': timestamp
        }
        
        if marked_by:
            result['marked_by'] = marked_by
        
        return result
    except ClientError:
        raise


def get_attendance(intern_id: str, date_str: str) -> Optional[dict]:
    """Get attendance for a specific intern on a specific date"""
    try:
        response = dynamodb.get_item(
            TableName=TABLE_NAME,
            Key={
                'PK': {'S': f'ATTENDANCE#{intern_id}'},
                'SK': {'S': f'DATE#{date_str}'}
            }
        )
        
        if 'Item' not in response:
            return None
        
        item = response['Item']
        result = {
            'intern_id': item['intern_id']['S'],
            'date': item['date']['S'],
            'status': item['status']['S'],
            'created_at': item['created_at']['S']
        }
        
        if 'marked_by' in item:
            result['marked_by'] = item['marked_by']['S']
        
        return result
    except ClientError:
        return None


def get_attendance_by_intern(intern_id: str, limit: int = 100) -> list:
    """Get all attendance records for an intern"""
    try:
        response = dynamodb.query(
            TableName=TABLE_NAME,
            KeyConditionExpression='PK = :pk',
            ExpressionAttributeValues={':pk': {'S': f'ATTENDANCE#{intern_id}'}},
            ScanIndexForward=False,
            Limit=limit
        )
        
        records = []
        for item in response.get('Items', []):
            record = {
                'intern_id': item['intern_id']['S'],
                'date': item['date']['S'],
                'status': item['status']['S'],
                'created_at': item['created_at']['S']
            }
            
            if 'marked_by' in item:
                record['marked_by'] = item['marked_by']['S']
            
            records.append(record)
        
        return records
    except ClientError:
        return []


def get_attendance_by_date(date_str: str) -> list:
    """Get all attendance records for a specific date"""
    try:
        response = dynamodb.query(
            TableName=TABLE_NAME,
            IndexName='GSI1',
            KeyConditionExpression='GSI1PK = :date',
            ExpressionAttributeValues={':date': {'S': f'ATT_DATE#{date_str}'}}
        )
        
        records = []
        for item in response.get('Items', []):
            record = {
                'intern_id': item['intern_id']['S'],
                'date': item['date']['S'],
                'status': item['status']['S'],
                'created_at': item['created_at']['S']
            }
            
            if 'marked_by' in item:
                record['marked_by'] = item['marked_by']['S']
            
            records.append(record)
        
        return records
    except ClientError:
        return []


def count_attendance_by_status(intern_id: str, month: str) -> dict:
    """Count attendance by status for a month (format: YYYY-MM)"""
    try:
        response = dynamodb.query(
            TableName=TABLE_NAME,
            KeyConditionExpression='PK = :pk AND begins_with(SK, :month)',
            ExpressionAttributeValues={
                ':pk': {'S': f'ATTENDANCE#{intern_id}'},
                ':month': {'S': f'DATE#{month}'}
            }
        )
        
        counts = {'present': 0, 'late': 0, 'absent': 0}
        
        for item in response.get('Items', []):
            status = item['status']['S']
            if status in counts:
                counts[status] += 1
        
        return counts
    except ClientError:
        return {'present': 0, 'late': 0, 'absent': 0}
