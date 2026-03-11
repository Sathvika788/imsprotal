"""
Seed script to create initial CEO, Manager, and Intern accounts
Run with: python scripts/seed.py
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Load .env explicitly before importing app modules
from dotenv import load_dotenv
load_dotenv()

from app.db.dynamo.client import bootstrap_table
from app.db.dynamo import user_repo
from app.core.security import get_password_hash


def seed_users():
    """Create initial users"""
    
    # Bootstrap table first
    bootstrap_table()
    
    users_to_create = [
        {
            'email': 'ceo@company.com',
            'password': 'Admin@1234',
            'role': 'ceo',
            'name': 'CEO User'
        },
        {
            'email': 'manager@company.com',
            'password': 'Admin@1234',
            'role': 'manager',
            'name': 'Manager User'
        },
        {
            'email': 'intern@company.com',
            'password': 'Admin@1234',
            'role': 'intern',
            'name': 'Intern User'
        }
    ]
    
    print("\n[Seed] Creating initial users...")
    
    for user_data in users_to_create:
        try:
            # Check if user already exists
            existing_user = user_repo.get_user_by_email(user_data['email'])
            if existing_user:
                print(f"[Seed] ⚠️  User {user_data['email']} already exists, skipping...")
                continue
            
            # Create user
            password_hash = get_password_hash(user_data['password'])
            user = user_repo.create_user(
                email=user_data['email'],
                password_hash=password_hash,
                role=user_data['role'],
                name=user_data['name']
            )
            print(f"[Seed] ✓ Created {user_data['role']}: {user_data['email']} / {user_data['password']}")
        
        except Exception as e:
            print(f"[Seed] ✗ Failed to create {user_data['email']}: {e}")
    
    print("\n[Seed] Seeding complete!")
    print("\nLogin credentials:")
    print("  CEO:     ceo@company.com     / Admin@1234")
    print("  Manager: manager@company.com / Admin@1234")
    print("  Intern:  intern@company.com  / Admin@1234")
    print()


if __name__ == "__main__":
    seed_users()
