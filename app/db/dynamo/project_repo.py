from typing import Optional
import uuid
from datetime import datetime
from app.db.dynamo.client import dynamodb
from botocore.exceptions import ClientError

TABLE_NAME = "IMS"


def create_project(
    intern_id: str,
    name: str,
    description: str,
    track: str,
    month: str,
    github_link: Optional[str] = None,
    document_url: Optional[str] = None
) -> dict:
    """Create a project submission"""
    project_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()
    
    item = {
        'PK': {'S': f'PROJECT#{project_id}'},
        'SK': {'S': 'PROJECT'},
        'GSI1PK': {'S': f'INTERN_PROJECTS#{intern_id}'},
        'GSI1SK': {'S': f'MONTH#{month}#TRACK#{track}#PROJ#{project_id}'},
        'id': {'S': project_id},
        'intern_id': {'S': intern_id},
        'name': {'S': name},
        'description': {'S': description},
        'track': {'S': track},
        'month': {'S': month},
        'status': {'S': 'pending'},
        'created_at': {'S': timestamp}
    }
    
    if github_link:
        item['github_link'] = {'S': github_link}
    if document_url:
        item['document_url'] = {'S': document_url}
    
    try:
        dynamodb.put_item(TableName=TABLE_NAME, Item=item)
        
        result = {
            'id': project_id,
            'intern_id': intern_id,
            'name': name,
            'description': description,
            'track': track,
            'month': month,
            'status': 'pending',
            'created_at': timestamp
        }
        
        if github_link:
            result['github_link'] = github_link
        if document_url:
            result['document_url'] = document_url
        
        return result
    except ClientError:
        raise


def get_project(project_id: str) -> Optional[dict]:
    """Get project by ID"""
    try:
        response = dynamodb.get_item(
            TableName=TABLE_NAME,
            Key={'PK': {'S': f'PROJECT#{project_id}'}, 'SK': {'S': 'PROJECT'}}
        )
        
        if 'Item' not in response:
            return None
        
        item = response['Item']
        result = {
            'id': item['id']['S'],
            'intern_id': item['intern_id']['S'],
            'name': item['name']['S'],
            'description': item['description']['S'],
            'track': item['track']['S'],
            'month': item['month']['S'],
            'status': item['status']['S'],
            'created_at': item['created_at']['S']
        }
        
        if 'github_link' in item:
            result['github_link'] = item['github_link']['S']
        if 'document_url' in item:
            result['document_url'] = item['document_url']['S']
        if 'grade' in item:
            result['grade'] = item['grade']['S']
        if 'feedback' in item:
            result['feedback'] = item['feedback']['S']
        if 'reviewed_by' in item:
            result['reviewed_by'] = item['reviewed_by']['S']
        if 'reviewed_at' in item:
            result['reviewed_at'] = item['reviewed_at']['S']
        
        return result
    except ClientError:
        return None


def get_projects_by_intern(intern_id: str) -> list:
    """Get all projects for an intern"""
    try:
        response = dynamodb.query(
            TableName=TABLE_NAME,
            IndexName='GSI1',
            KeyConditionExpression='GSI1PK = :intern',
            ExpressionAttributeValues={':intern': {'S': f'INTERN_PROJECTS#{intern_id}'}}
        )
        
        projects = []
        for item in response.get('Items', []):
            project = {
                'id': item['id']['S'],
                'intern_id': item['intern_id']['S'],
                'name': item['name']['S'],
                'description': item['description']['S'],
                'track': item['track']['S'],
                'month': item['month']['S'],
                'status': item['status']['S'],
                'created_at': item['created_at']['S']
            }
            
            if 'github_link' in item:
                project['github_link'] = item['github_link']['S']
            if 'document_url' in item:
                project['document_url'] = item['document_url']['S']
            if 'grade' in item:
                project['grade'] = item['grade']['S']
            if 'feedback' in item:
                project['feedback'] = item['feedback']['S']
            if 'reviewed_by' in item:
                project['reviewed_by'] = item['reviewed_by']['S']
            if 'reviewed_at' in item:
                project['reviewed_at'] = item['reviewed_at']['S']
            
            projects.append(project)
        
        return sorted(projects, key=lambda x: x['created_at'], reverse=True)
    except ClientError:
        return []


def get_all_projects() -> list:
    """Get all projects"""
    try:
        response = dynamodb.scan(
            TableName=TABLE_NAME,
            FilterExpression='begins_with(PK, :prefix)',
            ExpressionAttributeValues={':prefix': {'S': 'PROJECT#'}}
        )
        
        projects = []
        for item in response.get('Items', []):
            project = {
                'id': item['id']['S'],
                'intern_id': item['intern_id']['S'],
                'name': item['name']['S'],
                'description': item['description']['S'],
                'track': item['track']['S'],
                'month': item['month']['S'],
                'status': item['status']['S'],
                'created_at': item['created_at']['S']
            }
            
            if 'github_link' in item:
                project['github_link'] = item['github_link']['S']
            if 'document_url' in item:
                project['document_url'] = item['document_url']['S']
            if 'grade' in item:
                project['grade'] = item['grade']['S']
            if 'feedback' in item:
                project['feedback'] = item['feedback']['S']
            if 'reviewed_by' in item:
                project['reviewed_by'] = item['reviewed_by']['S']
            if 'reviewed_at' in item:
                project['reviewed_at'] = item['reviewed_at']['S']
            
            projects.append(project)
        
        return sorted(projects, key=lambda x: x['created_at'], reverse=True)
    except ClientError:
        return []


def update_project_review(
    project_id: str,
    status: str,
    grade: str,
    feedback: str,
    reviewed_by: str
) -> bool:
    """Review and grade a project"""
    try:
        timestamp = datetime.utcnow().isoformat()
        
        dynamodb.update_item(
            TableName=TABLE_NAME,
            Key={'PK': {'S': f'PROJECT#{project_id}'}, 'SK': {'S': 'PROJECT'}},
            UpdateExpression='SET #status = :status, grade = :grade, feedback = :feedback, reviewed_by = :reviewed_by, reviewed_at = :reviewed_at',
            ExpressionAttributeValues={
                ':status': {'S': status},
                ':grade': {'S': grade},
                ':feedback': {'S': feedback},
                ':reviewed_by': {'S': reviewed_by},
                ':reviewed_at': {'S': timestamp}
            },
            ExpressionAttributeNames={'#status': 'status'}
        )
        
        return True
    except ClientError:
        return False


def get_projects_by_track(track: str) -> list:
    """Get all projects by track"""
    all_projects = get_all_projects()
    return [p for p in all_projects if p['track'] == track]


def get_projects_by_month(month: str) -> list:
    """Get all projects by month"""
    all_projects = get_all_projects()
    return [p for p in all_projects if p['month'] == month]