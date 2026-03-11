from typing import Optional
import secrets
from datetime import datetime, timedelta
from app.db.dynamo.client import dynamodb
from botocore.exceptions import ClientError

TABLE_NAME = "IMS"


def create_invite(role: str, created_by: str) -> dict:
    """Create a one-time invite code with 72h expiry"""
    code = secrets.token_urlsafe(16)
    timestamp = datetime.utcnow()
    expiry = timestamp + timedelta(hours=72)
    
    item = {
        'PK': {'S': f'INVITE#{code}'},
        'SK': {'S': 'INVITE'},
        'code': {'S': code},
        'role': {'S': role},
        'created_by': {'S': created_by},
        'created_at': {'S': timestamp.isoformat()},
        'expires_at': {'S': expiry.isoformat()},
        'used': {'BOOL': False}
    }
    
    try:
        dynamodb.put_item(TableName=TABLE_NAME, Item=item)
        return {
            'code': code,
            'role': role,
            'created_by': created_by,
            'created_at': timestamp.isoformat(),
            'expires_at': expiry.isoformat(),
            'used': False
        }
    except ClientError:
        raise


def get_invite(code: str) -> Optional[dict]:
    """Get invite by code"""
    try:
        response = dynamodb.get_item(
            TableName=TABLE_NAME,
            Key={'PK': {'S': f'INVITE#{code}'}, 'SK': {'S': 'INVITE'}}
        )
        
        if 'Item' not in response:
            return None
        
        item = response['Item']
        return {
            'code': item['code']['S'],
            'role': item['role']['S'],
            'created_by': item['created_by']['S'],
            'created_at': item['created_at']['S'],
            'expires_at': item['expires_at']['S'],
            'used': item['used']['BOOL']
        }
    except ClientError:
        return None


def validate_invite(code: str) -> tuple[bool, Optional[str], Optional[str]]:
    """Validate invite code. Returns (is_valid, role, error_message)"""
    invite = get_invite(code)
    
    if not invite:
        return False, None, "Invalid invite code"
    
    if invite['used']:
        return False, None, "Invite code already used"
    
    expiry = datetime.fromisoformat(invite['expires_at'])
    if datetime.utcnow() > expiry:
        return False, None, "Invite code expired"
    
    return True, invite['role'], None


def consume_invite(code: str) -> bool:
    """Mark invite as used"""
    try:
        dynamodb.update_item(
            TableName=TABLE_NAME,
            Key={'PK': {'S': f'INVITE#{code}'}, 'SK': {'S': 'INVITE'}},
            UpdateExpression='SET used = :used',
            ExpressionAttributeValues={':used': {'BOOL': True}},
            ConditionExpression='used = :false',
            ExpressionAttributeNames={'#used': 'used'}
        )
        return True
    except ClientError:
        return False


def get_invites_by_creator(creator_id: str) -> list:
    """Get all invites created by a user"""
    try:
        response = dynamodb.scan(
            TableName=TABLE_NAME,
            FilterExpression='begins_with(PK, :prefix) AND created_by = :creator',
            ExpressionAttributeValues={
                ':prefix': {'S': 'INVITE#'},
                ':creator': {'S': creator_id}
            }
        )
        
        invites = []
        for item in response.get('Items', []):
            invites.append({
                'code': item['code']['S'],
                'role': item['role']['S'],
                'created_at': item['created_at']['S'],
                'expires_at': item['expires_at']['S'],
                'used': item['used']['BOOL']
            })
        
        return sorted(invites, key=lambda x: x['created_at'], reverse=True)
    except ClientError:
        return []
