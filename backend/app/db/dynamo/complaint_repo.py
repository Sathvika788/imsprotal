from typing import Optional
import uuid
from datetime import datetime
from app.db.dynamo.client import dynamodb
from botocore.exceptions import ClientError

TABLE_NAME = "IMS"


def create_complaint(
    intern_id: str,
    subject: str,
    description: str,
    category: str,  # 'work_environment', 'harassment', 'technical', 'other'
    is_anonymous: bool = False
) -> dict:
    """Create a complaint"""
    complaint_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()
    
    item = {
        'PK': {'S': f'COMPLAINT#{complaint_id}'},
        'SK': {'S': 'COMPLAINT'},
        'GSI1PK': {'S': f'INTERN_COMPLAINT#{intern_id}'},
        'GSI1SK': {'S': f'DATE#{timestamp}'},
        'id': {'S': complaint_id},
        'intern_id': {'S': intern_id},
        'subject': {'S': subject},
        'description': {'S': description},
        'category': {'S': category},
        'is_anonymous': {'BOOL': is_anonymous},
        'status': {'S': 'pending'},
        'created_at': {'S': timestamp}
    }
    
    try:
        dynamodb.put_item(TableName=TABLE_NAME, Item=item)
        
        return {
            'id': complaint_id,
            'intern_id': intern_id,
            'subject': subject,
            'description': description,
            'category': category,
            'is_anonymous': is_anonymous,
            'status': 'pending',
            'created_at': timestamp
        }
    except ClientError:
        raise


def get_complaint(complaint_id: str) -> Optional[dict]:
    """Get complaint by ID"""
    try:
        response = dynamodb.get_item(
            TableName=TABLE_NAME,
            Key={'PK': {'S': f'COMPLAINT#{complaint_id}'}, 'SK': {'S': 'COMPLAINT'}}
        )
        
        if 'Item' not in response:
            return None
        
        item = response['Item']
        result = {
            'id': item['id']['S'],
            'intern_id': item['intern_id']['S'],
            'subject': item['subject']['S'],
            'description': item['description']['S'],
            'category': item['category']['S'],
            'is_anonymous': item['is_anonymous']['BOOL'],
            'status': item['status']['S'],
            'created_at': item['created_at']['S']
        }
        
        if 'response' in item:
            result['response'] = item['response']['S']
        if 'responded_by' in item:
            result['responded_by'] = item['responded_by']['S']
        if 'responded_at' in item:
            result['responded_at'] = item['responded_at']['S']
        
        return result
    except ClientError:
        return None


def get_complaints_by_intern(intern_id: str) -> list:
    """Get all complaints by intern"""
    try:
        response = dynamodb.query(
            TableName=TABLE_NAME,
            IndexName='GSI1',
            KeyConditionExpression='GSI1PK = :intern',
            ExpressionAttributeValues={':intern': {'S': f'INTERN_COMPLAINT#{intern_id}'}}
        )
        
        complaints = []
        for item in response.get('Items', []):
            complaint = {
                'id': item['id']['S'],
                'intern_id': item['intern_id']['S'],
                'subject': item['subject']['S'],
                'description': item['description']['S'],
                'category': item['category']['S'],
                'is_anonymous': item['is_anonymous']['BOOL'],
                'status': item['status']['S'],
                'created_at': item['created_at']['S']
            }
            
            if 'response' in item:
                complaint['response'] = item['response']['S']
            if 'responded_by' in item:
                complaint['responded_by'] = item['responded_by']['S']
            if 'responded_at' in item:
                complaint['responded_at'] = item['responded_at']['S']
            
            complaints.append(complaint)
        
        return sorted(complaints, key=lambda x: x['created_at'], reverse=True)
    except ClientError:
        return []


def get_all_complaints() -> list:
    """Get all complaints"""
    try:
        response = dynamodb.scan(
            TableName=TABLE_NAME,
            FilterExpression='begins_with(PK, :prefix)',
            ExpressionAttributeValues={':prefix': {'S': 'COMPLAINT#'}}
        )
        
        complaints = []
        for item in response.get('Items', []):
            complaint = {
                'id': item['id']['S'],
                'intern_id': item['intern_id']['S'],
                'subject': item['subject']['S'],
                'description': item['description']['S'],
                'category': item['category']['S'],
                'is_anonymous': item['is_anonymous']['BOOL'],
                'status': item['status']['S'],
                'created_at': item['created_at']['S']
            }
            
            if 'response' in item:
                complaint['response'] = item['response']['S']
            if 'responded_by' in item:
                complaint['responded_by'] = item['responded_by']['S']
            if 'responded_at' in item:
                complaint['responded_at'] = item['responded_at']['S']
            
            complaints.append(complaint)
        
        return sorted(complaints, key=lambda x: x['created_at'], reverse=True)
    except ClientError:
        return []


def respond_to_complaint(
    complaint_id: str,
    response: str,
    responded_by: str,
    status: str = 'resolved'
) -> bool:
    """Respond to a complaint"""
    try:
        timestamp = datetime.utcnow().isoformat()
        
        dynamodb.update_item(
            TableName=TABLE_NAME,
            Key={'PK': {'S': f'COMPLAINT#{complaint_id}'}, 'SK': {'S': 'COMPLAINT'}},
            UpdateExpression='SET #status = :status, response = :response, responded_by = :responded_by, responded_at = :responded_at',
            ExpressionAttributeValues={
                ':status': {'S': status},
                ':response': {'S': response},
                ':responded_by': {'S': responded_by},
                ':responded_at': {'S': timestamp}
            },
            ExpressionAttributeNames={'#status': 'status'}
        )
        
        return True
    except ClientError:
        return False