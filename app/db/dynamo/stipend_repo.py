from typing import Optional
from datetime import datetime
from app.db.dynamo.client import dynamodb
from botocore.exceptions import ClientError

TABLE_NAME = "IMS"


def create_or_update_stipend(
    intern_id: str,
    month: str,
    base_amount: float,
    approved_expenses: float,
    bonus: float,
    penalty: float,
    total_amount: float,
    days_present: int,
    daily_rate: float
) -> dict:
    """Create or update stipend for an intern for a month"""
    timestamp = datetime.utcnow().isoformat()
    
    item = {
        'PK': {'S': f'STIPEND#{intern_id}'},
        'SK': {'S': f'MONTH#{month}'},
        'intern_id': {'S': intern_id},
        'month': {'S': month},
        'base_amount': {'N': str(base_amount)},
        'approved_expenses': {'N': str(approved_expenses)},
        'bonus': {'N': str(bonus)},
        'penalty': {'N': str(penalty)},
        'total_amount': {'N': str(total_amount)},
        'days_present': {'N': str(days_present)},
        'daily_rate': {'N': str(daily_rate)},
        'paid': {'BOOL': False},
        'updated_at': {'S': timestamp}
    }
    
    try:
        dynamodb.put_item(TableName=TABLE_NAME, Item=item)
        
        return {
            'intern_id': intern_id,
            'month': month,
            'base_amount': base_amount,
            'approved_expenses': approved_expenses,
            'bonus': bonus,
            'penalty': penalty,
            'total_amount': total_amount,
            'days_present': days_present,
            'daily_rate': daily_rate,
            'paid': False,
            'updated_at': timestamp
        }
    except ClientError:
        raise


def get_stipend(intern_id: str, month: str) -> Optional[dict]:
    """Get stipend for an intern for a specific month"""
    try:
        response = dynamodb.get_item(
            TableName=TABLE_NAME,
            Key={
                'PK': {'S': f'STIPEND#{intern_id}'},
                'SK': {'S': f'MONTH#{month}'}
            }
        )
        
        if 'Item' not in response:
            return None
        
        item = response['Item']
        return {
            'intern_id': item['intern_id']['S'],
            'month': item['month']['S'],
            'base_amount': float(item['base_amount']['N']),
            'approved_expenses': float(item['approved_expenses']['N']),
            'bonus': float(item['bonus']['N']),
            'penalty': float(item['penalty']['N']),
            'total_amount': float(item['total_amount']['N']),
            'days_present': int(item['days_present']['N']),
            'daily_rate': float(item['daily_rate']['N']),
            'paid': item['paid']['BOOL'],
            'updated_at': item['updated_at']['S']
        }
    except ClientError:
        return None


def get_stipends_by_intern(intern_id: str) -> list:
    """Get all stipends for an intern"""
    try:
        response = dynamodb.query(
            TableName=TABLE_NAME,
            KeyConditionExpression='PK = :pk',
            ExpressionAttributeValues={':pk': {'S': f'STIPEND#{intern_id}'}},
            ScanIndexForward=False
        )
        
        stipends = []
        for item in response.get('Items', []):
            stipends.append({
                'intern_id': item['intern_id']['S'],
                'month': item['month']['S'],
                'base_amount': float(item['base_amount']['N']),
                'approved_expenses': float(item['approved_expenses']['N']),
                'bonus': float(item['bonus']['N']),
                'penalty': float(item['penalty']['N']),
                'total_amount': float(item['total_amount']['N']),
                'days_present': int(item['days_present']['N']),
                'daily_rate': float(item['daily_rate']['N']),
                'paid': item['paid']['BOOL'],
                'updated_at': item['updated_at']['S']
            })
        
        return stipends
    except ClientError:
        return []


def update_stipend_adjustments(intern_id: str, month: str, bonus: float, penalty: float) -> bool:
    """Update bonus/penalty for a stipend"""
    try:
        # First get current stipend to recalculate total
        stipend = get_stipend(intern_id, month)
        if not stipend:
            return False
        
        new_total = stipend['base_amount'] + stipend['approved_expenses'] + bonus - penalty
        
        dynamodb.update_item(
            TableName=TABLE_NAME,
            Key={
                'PK': {'S': f'STIPEND#{intern_id}'},
                'SK': {'S': f'MONTH#{month}'}
            },
            UpdateExpression='SET bonus = :bonus, penalty = :penalty, total_amount = :total, updated_at = :updated_at',
            ExpressionAttributeValues={
                ':bonus': {'N': str(bonus)},
                ':penalty': {'N': str(penalty)},
                ':total': {'N': str(new_total)},
                ':updated_at': {'S': datetime.utcnow().isoformat()}
            }
        )
        
        return True
    except ClientError:
        return False


def mark_stipend_paid(intern_id: str, month: str, paid: bool) -> bool:
    """Mark stipend as paid/unpaid"""
    try:
        dynamodb.update_item(
            TableName=TABLE_NAME,
            Key={
                'PK': {'S': f'STIPEND#{intern_id}'},
                'SK': {'S': f'MONTH#{month}'}
            },
            UpdateExpression='SET paid = :paid, updated_at = :updated_at',
            ExpressionAttributeValues={
                ':paid': {'BOOL': paid},
                ':updated_at': {'S': datetime.utcnow().isoformat()}
            }
        )
        
        return True
    except ClientError:
        return False


def get_all_stipends_for_month(month: str) -> list:
    """Get all stipends for a specific month"""
    try:
        response = dynamodb.scan(
            TableName=TABLE_NAME,
            FilterExpression='begins_with(PK, :prefix) AND #month = :month',
            ExpressionAttributeValues={
                ':prefix': {'S': 'STIPEND#'},
                ':month': {'S': month}
            },
            ExpressionAttributeNames={'#month': 'month'}
        )
        
        stipends = []
        for item in response.get('Items', []):
            stipends.append({
                'intern_id': item['intern_id']['S'],
                'month': item['month']['S'],
                'base_amount': float(item['base_amount']['N']),
                'approved_expenses': float(item['approved_expenses']['N']),
                'bonus': float(item['bonus']['N']),
                'penalty': float(item['penalty']['N']),
                'total_amount': float(item['total_amount']['N']),
                'days_present': int(item['days_present']['N']),
                'daily_rate': float(item['daily_rate']['N']),
                'paid': item['paid']['BOOL'],
                'updated_at': item['updated_at']['S']
            })
        
        return stipends
    except ClientError:
        return []
