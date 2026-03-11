from typing import Optional
import uuid
from datetime import datetime
from app.db.dynamo.client import dynamodb
from botocore.exceptions import ClientError

TABLE_NAME = "IMS"


def create_expense(intern_id: str, amount: float, description: str, date_str: str, receipt_url: Optional[str] = None) -> dict:
    """Create an expense claim"""
    expense_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()
    
    item = {
        'PK': {'S': f'EXPENSE#{expense_id}'},
        'SK': {'S': 'EXPENSE'},
        'GSI1PK': {'S': 'ALL_EXPENSES'},
        'GSI1SK': {'S': f'STATUS#pending#EXP#{expense_id}'},
        'id': {'S': expense_id},
        'intern_id': {'S': intern_id},
        'amount': {'N': str(amount)},
        'description': {'S': description},
        'date': {'S': date_str},
        'status': {'S': 'pending'},
        'created_at': {'S': timestamp}
    }
    
    if receipt_url:
        item['receipt_url'] = {'S': receipt_url}
    
    try:
        dynamodb.put_item(TableName=TABLE_NAME, Item=item)
        
        result = {
            'id': expense_id,
            'intern_id': intern_id,
            'amount': amount,
            'description': description,
            'date': date_str,
            'status': 'pending',
            'created_at': timestamp
        }
        
        if receipt_url:
            result['receipt_url'] = receipt_url
        
        return result
    except ClientError:
        raise


def get_expense(expense_id: str) -> Optional[dict]:
    """Get expense by ID"""
    try:
        response = dynamodb.get_item(
            TableName=TABLE_NAME,
            Key={'PK': {'S': f'EXPENSE#{expense_id}'}, 'SK': {'S': 'EXPENSE'}}
        )
        
        if 'Item' not in response:
            return None
        
        item = response['Item']
        result = {
            'id': item['id']['S'],
            'intern_id': item['intern_id']['S'],
            'amount': float(item['amount']['N']),
            'description': item['description']['S'],
            'date': item['date']['S'],
            'status': item['status']['S'],
            'created_at': item['created_at']['S']
        }
        
        if 'receipt_url' in item:
            result['receipt_url'] = item['receipt_url']['S']
        if 'reviewed_by' in item:
            result['reviewed_by'] = item['reviewed_by']['S']
        if 'reviewed_at' in item:
            result['reviewed_at'] = item['reviewed_at']['S']
        if 'review_notes' in item:
            result['review_notes'] = item['review_notes']['S']
        
        return result
    except ClientError:
        return None


def get_expenses_by_intern(intern_id: str) -> list:
    """Get all expenses for an intern"""
    try:
        response = dynamodb.scan(
            TableName=TABLE_NAME,
            FilterExpression='begins_with(PK, :prefix) AND intern_id = :intern_id',
            ExpressionAttributeValues={
                ':prefix': {'S': 'EXPENSE#'},
                ':intern_id': {'S': intern_id}
            }
        )
        
        expenses = []
        for item in response.get('Items', []):
            expense = {
                'id': item['id']['S'],
                'intern_id': item['intern_id']['S'],
                'amount': float(item['amount']['N']),
                'description': item['description']['S'],
                'date': item['date']['S'],
                'status': item['status']['S'],
                'created_at': item['created_at']['S']
            }
            
            if 'receipt_url' in item:
                expense['receipt_url'] = item['receipt_url']['S']
            if 'reviewed_by' in item:
                expense['reviewed_by'] = item['reviewed_by']['S']
            if 'reviewed_at' in item:
                expense['reviewed_at'] = item['reviewed_at']['S']
            if 'review_notes' in item:
                expense['review_notes'] = item['review_notes']['S']
            
            expenses.append(expense)
        
        return sorted(expenses, key=lambda x: x['created_at'], reverse=True)
    except ClientError:
        return []


def get_all_expenses() -> list:
    """Get all expenses"""
    try:
        response = dynamodb.query(
            TableName=TABLE_NAME,
            IndexName='GSI1',
            KeyConditionExpression='GSI1PK = :all',
            ExpressionAttributeValues={':all': {'S': 'ALL_EXPENSES'}}
        )
        
        expenses = []
        for item in response.get('Items', []):
            expense = {
                'id': item['id']['S'],
                'intern_id': item['intern_id']['S'],
                'amount': float(item['amount']['N']),
                'description': item['description']['S'],
                'date': item['date']['S'],
                'status': item['status']['S'],
                'created_at': item['created_at']['S']
            }
            
            if 'receipt_url' in item:
                expense['receipt_url'] = item['receipt_url']['S']
            if 'reviewed_by' in item:
                expense['reviewed_by'] = item['reviewed_by']['S']
            if 'reviewed_at' in item:
                expense['reviewed_at'] = item['reviewed_at']['S']
            if 'review_notes' in item:
                expense['review_notes'] = item['review_notes']['S']
            
            expenses.append(expense)
        
        return sorted(expenses, key=lambda x: x['created_at'], reverse=True)
    except ClientError:
        return []


def update_expense_status(expense_id: str, status: str, reviewed_by: str, review_notes: Optional[str] = None) -> bool:
    """Update expense status (approve/reject)"""
    try:
        timestamp = datetime.utcnow().isoformat()
        
        # Update GSI1SK to reflect new status
        new_gsi1sk = f'STATUS#{status}#EXP#{expense_id}'
        
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
            Key={'PK': {'S': f'EXPENSE#{expense_id}'}, 'SK': {'S': 'EXPENSE'}},
            UpdateExpression=update_expr,
            ExpressionAttributeValues=expr_values,
            ExpressionAttributeNames={'#status': 'status'}
        )
        
        return True
    except ClientError:
        return False


def get_approved_expenses_total(intern_id: str, month: str) -> float:
    """Get total approved expenses for an intern in a month (format: YYYY-MM)"""
    try:
        expenses = get_expenses_by_intern(intern_id)
        total = 0.0
        
        for expense in expenses:
            if expense['status'] == 'approved' and expense['date'].startswith(month):
                total += expense['amount']
        
        return total
    except:
        return 0.0
