from typing import Optional
import uuid
from datetime import datetime
from app.db.dynamo.client import dynamodb
from botocore.exceptions import ClientError

TABLE_NAME = "IMS"


def create_wfh_request(intern_id: str, date: str, reason: str) -> dict:
    """Create a work from home request"""
    wfh_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()
    
    item = {
        'PK': {'S': f'WFH#{wfh_id}'},
        'SK': {'S': 'WFH'},
        'GSI1PK': {'S': f'INTERN_WFH#{intern_id}'},
        'GSI1SK': {'S': f'STATUS#pending#WFH#{wfh_id}'},
        'id': {'S': wfh_id},
        'intern_id': {'S': intern_id},
        'date': {'S': date},
        'reason': {'S': reason},
        'status': {'S': 'pending'},
        'created_at': {'S': timestamp}
    }
    
    try:
        dynamodb.put_item(TableName=TABLE_NAME, Item=item)
        
        return {
            'id': wfh_id,
            'intern_id': intern_id,
            'date': date,
            'reason': reason,
            'status': 'pending',
            'created_at': timestamp
        }
    except ClientError:
        raise


def get_wfh_request(wfh_id: str) -> Optional[dict]:
    """Get WFH request by ID"""
    try:
        response = dynamodb.get_item(
            TableName=TABLE_NAME,
            Key={'PK': {'S': f'WFH#{wfh_id}'}, 'SK': {'S': 'WFH'}}
        )
        
        if 'Item' not in response:
            return None
        
        item = response['Item']
        result = {
            'id': item['id']['S'],
            'intern_id': item['intern_id']['S'],
            'date': item['date']['S'],
            'reason': item['reason']['S'],
            'status': item['status']['S'],
            'created_at': item['created_at']['S']
        }
        
        if 'reviewed_by' in item:
            result['reviewed_by'] = item['reviewed_by']['S']
        if 'reviewed_at' in item:
            result['reviewed_at'] = item['reviewed_at']['S']
        
        return result
    except ClientError:
        return None


def get_wfh_by_intern(intern_id: str) -> list:
    """Get all WFH requests for an intern"""
    try:
        response = dynamodb.query(
            TableName=TABLE_NAME,
            IndexName='GSI1',
            KeyConditionExpression='GSI1PK = :intern',
            ExpressionAttributeValues={':intern': {'S': f'INTERN_WFH#{intern_id}'}}
        )
        
        wfh_requests = []
        for item in response.get('Items', []):
            wfh = {
                'id': item['id']['S'],
                'intern_id': item['intern_id']['S'],
                'date': item['date']['S'],
                'reason': item['reason']['S'],
                'status': item['status']['S'],
                'created_at': item['created_at']['S']
            }
            
            if 'reviewed_by' in item:
                wfh['reviewed_by'] = item['reviewed_by']['S']
            if 'reviewed_at' in item:
                wfh['reviewed_at'] = item['reviewed_at']['S']
            
            wfh_requests.append(wfh)
        
        return sorted(wfh_requests, key=lambda x: x['created_at'], reverse=True)
    except ClientError:
        return []


def get_all_wfh_requests() -> list:
    """Get all WFH requests"""
    try:
        response = dynamodb.scan(
            TableName=TABLE_NAME,
            FilterExpression='begins_with(PK, :prefix)',
            ExpressionAttributeValues={':prefix': {'S': 'WFH#'}}
        )
        
        wfh_requests = []
        for item in response.get('Items', []):
            wfh = {
                'id': item['id']['S'],
                'intern_id': item['intern_id']['S'],
                'date': item['date']['S'],
                'reason': item['reason']['S'],
                'status': item['status']['S'],
                'created_at': item['created_at']['S']
            }
            
            if 'reviewed_by' in item:
                wfh['reviewed_by'] = item['reviewed_by']['S']
            if 'reviewed_at' in item:
                wfh['reviewed_at'] = item['reviewed_at']['S']
            
            wfh_requests.append(wfh)
        
        return sorted(wfh_requests, key=lambda x: x['created_at'], reverse=True)
    except ClientError:
        return []


def update_wfh_status(wfh_id: str, status: str, reviewed_by: str) -> bool:
    """Approve or reject WFH request"""
    try:
        timestamp = datetime.utcnow().isoformat()
        
        # Update GSI1SK to reflect new status
        new_gsi1sk = f'STATUS#{status}#WFH#{wfh_id}'
        
        dynamodb.update_item(
            TableName=TABLE_NAME,
            Key={'PK': {'S': f'WFH#{wfh_id}'}, 'SK': {'S': 'WFH'}},
            UpdateExpression='SET #status = :status, GSI1SK = :gsi1sk, reviewed_by = :reviewed_by, reviewed_at = :reviewed_at',
            ExpressionAttributeValues={
                ':status': {'S': status},
                ':gsi1sk': {'S': new_gsi1sk},
                ':reviewed_by': {'S': reviewed_by},
                ':reviewed_at': {'S': timestamp}
            },
            ExpressionAttributeNames={'#status': 'status'}
        )
        
        return True
    except ClientError:
        return False