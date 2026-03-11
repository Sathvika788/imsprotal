from typing import Optional
import uuid
from datetime import datetime
from app.db.dynamo.client import dynamodb
from botocore.exceptions import ClientError

TABLE_NAME = "IMS"


def create_kt(
    intern_id: str,
    topic: str,
    description: str,
    document_url: Optional[str] = None
) -> dict:
    """Create a Knowledge Transfer document"""
    kt_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()
    
    item = {
        'PK': {'S': f'KT#{kt_id}'},
        'SK': {'S': 'KT'},
        'GSI1PK': {'S': f'INTERN_KT#{intern_id}'},
        'GSI1SK': {'S': f'DATE#{timestamp}'},
        'id': {'S': kt_id},
        'intern_id': {'S': intern_id},
        'topic': {'S': topic},
        'description': {'S': description},
        'status': {'S': 'pending'},
        'created_at': {'S': timestamp}
    }
    
    if document_url:
        item['document_url'] = {'S': document_url}
    
    try:
        dynamodb.put_item(TableName=TABLE_NAME, Item=item)
        
        result = {
            'id': kt_id,
            'intern_id': intern_id,
            'topic': topic,
            'description': description,
            'status': 'pending',
            'created_at': timestamp
        }
        
        if document_url:
            result['document_url'] = document_url
        
        return result
    except ClientError:
        raise


def get_kt(kt_id: str) -> Optional[dict]:
    """Get KT by ID"""
    try:
        response = dynamodb.get_item(
            TableName=TABLE_NAME,
            Key={'PK': {'S': f'KT#{kt_id}'}, 'SK': {'S': 'KT'}}
        )
        
        if 'Item' not in response:
            return None
        
        item = response['Item']
        result = {
            'id': item['id']['S'],
            'intern_id': item['intern_id']['S'],
            'topic': item['topic']['S'],
            'description': item['description']['S'],
            'status': item['status']['S'],
            'created_at': item['created_at']['S']
        }
        
        if 'document_url' in item:
            result['document_url'] = item['document_url']['S']
        if 'grade' in item:
            result['grade'] = item['grade']['S']
        if 'suggestions' in item:
            result['suggestions'] = item['suggestions']['S']
        if 'reviewed_by' in item:
            result['reviewed_by'] = item['reviewed_by']['S']
        if 'reviewed_at' in item:
            result['reviewed_at'] = item['reviewed_at']['S']
        
        return result
    except ClientError:
        return None


def get_kts_by_intern(intern_id: str) -> list:
    """Get all KTs by intern"""
    try:
        response = dynamodb.query(
            TableName=TABLE_NAME,
            IndexName='GSI1',
            KeyConditionExpression='GSI1PK = :intern',
            ExpressionAttributeValues={':intern': {'S': f'INTERN_KT#{intern_id}'}}
        )
        
        kts = []
        for item in response.get('Items', []):
            kt = {
                'id': item['id']['S'],
                'intern_id': item['intern_id']['S'],
                'topic': item['topic']['S'],
                'description': item['description']['S'],
                'status': item['status']['S'],
                'created_at': item['created_at']['S']
            }
            
            if 'document_url' in item:
                kt['document_url'] = item['document_url']['S']
            if 'grade' in item:
                kt['grade'] = item['grade']['S']
            if 'suggestions' in item:
                kt['suggestions'] = item['suggestions']['S']
            if 'reviewed_by' in item:
                kt['reviewed_by'] = item['reviewed_by']['S']
            if 'reviewed_at' in item:
                kt['reviewed_at'] = item['reviewed_at']['S']
            
            kts.append(kt)
        
        return sorted(kts, key=lambda x: x['created_at'], reverse=True)
    except ClientError:
        return []


def get_all_kts() -> list:
    """Get all KTs"""
    try:
        response = dynamodb.scan(
            TableName=TABLE_NAME,
            FilterExpression='begins_with(PK, :prefix)',
            ExpressionAttributeValues={':prefix': {'S': 'KT#'}}
        )
        
        kts = []
        for item in response.get('Items', []):
            kt = {
                'id': item['id']['S'],
                'intern_id': item['intern_id']['S'],
                'topic': item['topic']['S'],
                'description': item['description']['S'],
                'status': item['status']['S'],
                'created_at': item['created_at']['S']
            }
            
            if 'document_url' in item:
                kt['document_url'] = item['document_url']['S']
            if 'grade' in item:
                kt['grade'] = item['grade']['S']
            if 'suggestions' in item:
                kt['suggestions'] = item['suggestions']['S']
            if 'reviewed_by' in item:
                kt['reviewed_by'] = item['reviewed_by']['S']
            if 'reviewed_at' in item:
                kt['reviewed_at'] = item['reviewed_at']['S']
            
            kts.append(kt)
        
        return sorted(kts, key=lambda x: x['created_at'], reverse=True)
    except ClientError:
        return []


def review_kt(
    kt_id: str,
    grade: str,
    suggestions: str,
    reviewed_by: str,
    status: str = 'reviewed'
) -> bool:
    """Review a KT document"""
    try:
        timestamp = datetime.utcnow().isoformat()
        
        dynamodb.update_item(
            TableName=TABLE_NAME,
            Key={'PK': {'S': f'KT#{kt_id}'}, 'SK': {'S': 'KT'}},
            UpdateExpression='SET #status = :status, grade = :grade, suggestions = :suggestions, reviewed_by = :reviewed_by, reviewed_at = :reviewed_at',
            ExpressionAttributeValues={
                ':status': {'S': status},
                ':grade': {'S': grade},
                ':suggestions': {'S': suggestions},
                ':reviewed_by': {'S': reviewed_by},
                ':reviewed_at': {'S': timestamp}
            },
            ExpressionAttributeNames={'#status': 'status'}
        )
        
        return True
    except ClientError:
        return False