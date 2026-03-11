from typing import Optional, List
import uuid
from datetime import datetime
from app.db.dynamo.client import dynamodb
from botocore.exceptions import ClientError

TABLE_NAME = "IMS"


def create_task(
    title: str,
    description: str,
    assigned_to_email: str,  # Changed from intern_id to email
    assigned_by: str,
    priority: str = 'medium',
    due_date: Optional[str] = None
) -> dict:
    """Create a new task"""
    task_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()
    
    item = {
        'PK': {'S': f'TASK#{task_id}'},
        'SK': {'S': 'TASK'},
        'GSI1PK': {'S': f'INTERN_EMAIL#{assigned_to_email}'},  # Changed to email
        'GSI1SK': {'S': f'DATE#{timestamp}'},
        'id': {'S': task_id},
        'title': {'S': title},
        'description': {'S': description},
        'assigned_to_email': {'S': assigned_to_email},  # Store email
        'assigned_by': {'S': assigned_by},
        'priority': {'S': priority},
        'status': {'S': 'pending'},
        'created_at': {'S': timestamp},
        'updated_at': {'S': timestamp}
    }
    
    if due_date:
        item['due_date'] = {'S': due_date}
    
    try:
        dynamodb.put_item(TableName=TABLE_NAME, Item=item)
        
        result = {
            'id': task_id,
            'title': title,
            'description': description,
            'assigned_to_email': assigned_to_email,
            'assigned_by': assigned_by,
            'priority': priority,
            'status': 'pending',
            'created_at': timestamp,
            'updated_at': timestamp
        }
        
        if due_date:
            result['due_date'] = due_date
        
        return result
    except ClientError:
        raise


def get_task(task_id: str) -> Optional[dict]:
    """Get a task by ID"""
    try:
        response = dynamodb.get_item(
            TableName=TABLE_NAME,
            Key={'PK': {'S': f'TASK#{task_id}'}, 'SK': {'S': 'TASK'}}
        )
        
        if 'Item' not in response:
            return None
        
        item = response['Item']
        result = {
            'id': item['id']['S'],
            'title': item['title']['S'],
            'description': item['description']['S'],
            'assigned_to_email': item['assigned_to_email']['S'],
            'assigned_by': item['assigned_by']['S'],
            'priority': item['priority']['S'],
            'status': item['status']['S'],
            'created_at': item['created_at']['S'],
            'updated_at': item['updated_at']['S']
        }
        
        if 'due_date' in item:
            result['due_date'] = item['due_date']['S']
        if 'completed_at' in item:
            result['completed_at'] = item['completed_at']['S']
        
        return result
    except ClientError:
        return None


def get_tasks_by_email(email: str) -> List[dict]:
    """Get all tasks assigned to a specific email"""
    try:
        response = dynamodb.query(
            TableName=TABLE_NAME,
            IndexName='GSI1',
            KeyConditionExpression='GSI1PK = :email',
            ExpressionAttributeValues={':email': {'S': f'INTERN_EMAIL#{email}'}}
        )
        
        tasks = []
        for item in response.get('Items', []):
            task = {
                'id': item['id']['S'],
                'title': item['title']['S'],
                'description': item['description']['S'],
                'assigned_to_email': item['assigned_to_email']['S'],
                'assigned_by': item['assigned_by']['S'],
                'priority': item['priority']['S'],
                'status': item['status']['S'],
                'created_at': item['created_at']['S'],
                'updated_at': item['updated_at']['S']
            }
            
            if 'due_date' in item:
                task['due_date'] = item['due_date']['S']
            if 'completed_at' in item:
                task['completed_at'] = item['completed_at']['S']
            
            tasks.append(task)
        
        return sorted(tasks, key=lambda x: x['created_at'], reverse=True)
    except ClientError:
        return []


def get_all_tasks() -> List[dict]:
    """Get all tasks"""
    try:
        response = dynamodb.scan(
            TableName=TABLE_NAME,
            FilterExpression='begins_with(PK, :prefix)',
            ExpressionAttributeValues={':prefix': {'S': 'TASK#'}}
        )
        
        tasks = []
        for item in response.get('Items', []):
            task = {
                'id': item['id']['S'],
                'title': item['title']['S'],
                'description': item['description']['S'],
                'assigned_to_email': item['assigned_to_email']['S'],
                'assigned_by': item['assigned_by']['S'],
                'priority': item['priority']['S'],
                'status': item['status']['S'],
                'created_at': item['created_at']['S'],
                'updated_at': item['updated_at']['S']
            }
            
            if 'due_date' in item:
                task['due_date'] = item['due_date']['S']
            if 'completed_at' in item:
                task['completed_at'] = item['completed_at']['S']
            
            tasks.append(task)
        
        return sorted(tasks, key=lambda x: x['created_at'], reverse=True)
    except ClientError:
        return []


def update_task_status(task_id: str, status: str) -> bool:
    """Update task status"""
    try:
        timestamp = datetime.utcnow().isoformat()
        
        update_expr = 'SET #status = :status, updated_at = :updated_at'
        expr_values = {
            ':status': {'S': status},
            ':updated_at': {'S': timestamp}
        }
        
        if status == 'completed':
            update_expr += ', completed_at = :completed_at'
            expr_values[':completed_at'] = {'S': timestamp}
        
        dynamodb.update_item(
            TableName=TABLE_NAME,
            Key={'PK': {'S': f'TASK#{task_id}'}, 'SK': {'S': 'TASK'}},
            UpdateExpression=update_expr,
            ExpressionAttributeValues=expr_values,
            ExpressionAttributeNames={'#status': 'status'}
        )
        
        return True
    except ClientError:
        return False


def delete_task(task_id: str) -> bool:
    """Delete a task"""
    try:
        dynamodb.delete_item(
            TableName=TABLE_NAME,
            Key={'PK': {'S': f'TASK#{task_id}'}, 'SK': {'S': 'TASK'}}
        )
        return True
    except ClientError:
        return False