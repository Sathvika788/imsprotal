from typing import Optional
import uuid
from datetime import datetime, timedelta
from app.db.dynamo.client import dynamodb
from botocore.exceptions import ClientError

TABLE_NAME = "IMS"


def create_user(email: str, password_hash: str, role: str, name: str) -> dict:
    """Create user with email index using transaction"""
    user_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()
    
    user_item = {
        'PK': {'S': f'USER#{user_id}'},
        'SK': {'S': 'PROFILE'},
        'GSI1PK': {'S': f'ROLE#{role}'},
        'GSI1SK': {'S': f'USER#{user_id}'},
        'id': {'S': user_id},
        'email': {'S': email},
        'password_hash': {'S': password_hash},
        'role': {'S': role},
        'name': {'S': name},
        'created_at': {'S': timestamp}
    }
    
    email_index_item = {
        'PK': {'S': f'EMAIL#{email}'},
        'SK': {'S': 'USER_ID'},
        'user_id': {'S': user_id}
    }
    
    try:
        dynamodb.transact_write_items(
            TransactItems=[
                {'Put': {'TableName': TABLE_NAME, 'Item': user_item}},
                {'Put': {'TableName': TABLE_NAME, 'Item': email_index_item, 'ConditionExpression': 'attribute_not_exists(PK)'}}
            ]
        )
        
        return {
            'id': user_id,
            'email': email,
            'role': role,
            'name': name,
            'created_at': timestamp
        }
    except ClientError as e:
        if e.response['Error']['Code'] == 'TransactionCanceledException':
            raise ValueError("Email already registered")
        raise


def get_user_by_email(email: str) -> Optional[dict]:
    """Get user by email using email index or scan"""
    try:
        # First try email index
        try:
            response = dynamodb.get_item(
                TableName=TABLE_NAME,
                Key={'PK': {'S': f'EMAIL#{email}'}, 'SK': {'S': 'USER_ID'}}
            )
            
            if 'Item' in response:
                user_id = response['Item']['user_id']['S']
                
                # Get full user profile
                response = dynamodb.get_item(
                    TableName=TABLE_NAME,
                    Key={'PK': {'S': f'USER#{user_id}'}, 'SK': {'S': 'PROFILE'}}
                )
                
                if 'Item' in response:
                    item = response['Item']
                    return {
                        'id': item['id']['S'],
                        'email': item['email']['S'],
                        'password_hash': item['password_hash']['S'],
                        'role': item['role']['S'],
                        'name': item['name']['S'],
                        'created_at': item['created_at']['S']
                    }
        except:
            pass
        
        # Fallback: Scan for user with email
        response = dynamodb.scan(
            TableName=TABLE_NAME,
            FilterExpression='#email = :email',
            ExpressionAttributeNames={'#email': 'email'},
            ExpressionAttributeValues={':email': {'S': email}}
        )
        
        if response.get('Items'):
            item = response['Items'][0]
            return {
                'id': item.get('id', {}).get('S', email),
                'email': item['email']['S'],
                'password_hash': item.get('password_hash', {}).get('S', ''),
                'role': item['role']['S'],
                'name': item.get('name', {}).get('S', ''),
                'created_at': item.get('created_at', {}).get('S', '')
            }
        
        return None
    except ClientError as e:
        print(f"[DB] Error getting user by email '{email}': {e}")
        return None


def get_user_by_id(user_id: str) -> Optional[dict]:
    """Get user by ID"""
    try:
        # First try standard UUID format
        try:
            response = dynamodb.get_item(
                TableName=TABLE_NAME,
                Key={'PK': {'S': f'USER#{user_id}'}, 'SK': {'S': 'PROFILE'}}
            )
            
            if 'Item' in response:
                item = response['Item']
                return {
                    'id': item['id']['S'],
                    'email': item['email']['S'],
                    'password_hash': item.get('password_hash', {}).get('S', ''),
                    'role': item['role']['S'],
                    'name': item['name']['S'],
                    'created_at': item['created_at']['S']
                }
        except:
            pass
        
        # Fallback: If user_id is an email, use get_user_by_email
        if '@' in user_id:
            return get_user_by_email(user_id)
        
        # Last resort: Scan for user with id
        response = dynamodb.scan(
            TableName=TABLE_NAME,
            FilterExpression='#id = :id',
            ExpressionAttributeNames={'#id': 'id'},
            ExpressionAttributeValues={':id': {'S': user_id}}
        )
        
        if response.get('Items'):
            item = response['Items'][0]
            return {
                'id': item.get('id', {}).get('S', ''),
                'email': item['email']['S'],
                'password_hash': item.get('password_hash', {}).get('S', ''),
                'role': item['role']['S'],
                'name': item.get('name', {}).get('S', ''),
                'created_at': item.get('created_at', {}).get('S', '')
            }
        
        return None
    except ClientError:
        return None


def get_users_by_role(role: str) -> list:
    """Get all users with a specific role"""
    try:
        print(f"[REPO] Getting users with role: {role}")
        
        # First try GSI1 query
        try:
            print(f"[REPO] Trying GSI1 query for role {role}")
            response = dynamodb.query(
                TableName=TABLE_NAME,
                IndexName='GSI1',
                KeyConditionExpression='GSI1PK = :role',
                ExpressionAttributeValues={':role': {'S': f'ROLE#{role}'}}
            )
            
            items_found = response.get('Items', [])
            print(f"[REPO] GSI1 returned {len(items_found)} items")
            
            if items_found:
                users = []
                for item in items_found:
                    users.append({
                        'id': item.get('id', {}).get('S', item.get('email', {}).get('S', '')),
                        'email': item['email']['S'],
                        'role': item['role']['S'],
                        'name': item.get('name', {}).get('S', 'Unknown'),
                        'created_at': item.get('created_at', {}).get('S', '')
                    })
                print(f"[REPO] Returning {len(users)} users from GSI1")
                return users
        except Exception as e:
            print(f"[REPO] GSI1 query failed: {e}")
            pass
        
        # Fallback: Scan for users with the specified role (with limit)
        print(f"[REPO] Falling back to scan for role {role}")
        response = dynamodb.scan(
            TableName=TABLE_NAME,
            FilterExpression='#role = :role',
            ExpressionAttributeNames={'#role': 'role'},
            ExpressionAttributeValues={':role': {'S': role}},
            Limit=100
        )
        
        items_found = response.get('Items', [])
        print(f"[REPO] Scan returned {len(items_found)} items for role {role}")
        
        users = []
        for item in items_found:
            if 'email' in item:
                user_obj = {
                    'id': item.get('id', {}).get('S', item.get('email', {}).get('S', '')),
                    'email': item['email']['S'],
                    'role': item['role']['S'],
                    'name': item.get('name', {}).get('S', 'Unknown'),
                    'created_at': item.get('created_at', {}).get('S', '')
                }
                users.append(user_obj)
                print(f"[REPO] Added user: {user_obj}")
        
        print(f"[REPO] Returning {len(users)} users from scan")
        return users
    except ClientError as e:
        print(f"[REPO] Error getting users by role '{role}': {e}")
        return []
    except Exception as e:
        print(f"[REPO] Unexpected error getting users by role '{role}': {e}")
        return []


def update_user(user_id: str, updates: dict) -> bool:
    """Update user fields"""
    try:
        update_expr_parts = []
        expr_attr_values = {}
        
        for key, value in updates.items():
            update_expr_parts.append(f'{key} = :{key}')
            expr_attr_values[f':{key}'] = {'S': str(value)}
        
        if not update_expr_parts:
            return False
        
        dynamodb.update_item(
            TableName=TABLE_NAME,
            Key={'PK': {'S': f'USER#{user_id}'}, 'SK': {'S': 'PROFILE'}},
            UpdateExpression='SET ' + ', '.join(update_expr_parts),
            ExpressionAttributeValues=expr_attr_values
        )
        
        return True
    except ClientError:
        return False
def delete_user(user_id: str) -> bool:
    """Delete a user (soft delete by marking as deleted)"""
    try:
        timestamp = datetime.utcnow().isoformat()
        
        # Mark as deleted instead of actually deleting
        dynamodb.update_item(
            TableName=TABLE_NAME,
            Key={'PK': {'S': f'USER#{user_id}'}, 'SK': {'S': 'USER'}},
            UpdateExpression='SET deleted = :deleted, deleted_at = :timestamp',
            ExpressionAttributeValues={
                ':deleted': {'BOOL': True},
                ':timestamp': {'S': timestamp}
            }
        )
        
        return True
    except ClientError:
        return False


def store_password_reset_token(user_id: str, reset_token: str, expiry_hours: int = 24) -> bool:
    """Store password reset token with expiration"""
    try:
        expiry_time = datetime.utcnow() + timedelta(hours=expiry_hours)
        
        # Store token in a separate item for easy lookup and expiration
        dynamodb.put_item(
            TableName=TABLE_NAME,
            Item={
                'PK': {'S': f'TOKEN#{reset_token}'},
                'SK': {'S': 'RESET'},
                'user_id': {'S': user_id},
                'expires_at': {'S': expiry_time.isoformat()},
                'created_at': {'S': datetime.utcnow().isoformat()},
                'used': {'BOOL': False}
            }
        )
        
        return True
    except ClientError as e:
        print(f"[DB] Failed to store reset token: {e}")
        return False


def verify_password_reset_token(token: str) -> Optional[str]:
    """Verify password reset token and return user_id if valid"""
    try:
        response = dynamodb.get_item(
            TableName=TABLE_NAME,
            Key={'PK': {'S': f'TOKEN#{token}'}, 'SK': {'S': 'RESET'}}
        )
        
        if 'Item' not in response:
            return None
        
        item = response['Item']
        
        # Check if already used
        if item.get('used', {}).get('BOOL', False):
            return None
        
        # Check if expired
        expires_at = datetime.fromisoformat(item['expires_at']['S'])
        if datetime.utcnow() > expires_at:
            return None
        
        return item['user_id']['S']
    except ClientError:
        return None


def invalidate_password_reset_token(token: str) -> bool:
    """Mark password reset token as used (invalidate it)"""
    try:
        dynamodb.update_item(
            TableName=TABLE_NAME,
            Key={'PK': {'S': f'TOKEN#{token}'}, 'SK': {'S': 'RESET'}},
            UpdateExpression='SET used = :used, used_at = :timestamp',
            ExpressionAttributeValues={
                ':used': {'BOOL': True},
                ':timestamp': {'S': datetime.utcnow().isoformat()}
            }
        )
        
        return True
    except ClientError:
        return False


def update_password(user_id: str, password_hash: str) -> bool:
    """Update user password"""
    try:
        dynamodb.update_item(
            TableName=TABLE_NAME,
            Key={'PK': {'S': f'USER#{user_id}'}, 'SK': {'S': 'PROFILE'}},
            UpdateExpression='SET password_hash = :hash, updated_at = :timestamp',
            ExpressionAttributeValues={
                ':hash': {'S': password_hash},
                ':timestamp': {'S': datetime.utcnow().isoformat()}
            }
        )
        
        return True
    except ClientError:
        return False