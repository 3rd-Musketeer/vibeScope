#!/usr/bin/env python3
"""Test authentication system"""

import requests
import json

def test_auth():
    base_url = "http://localhost:8000"
    
    print("🧪 Testing authentication system...")
    
    # Test unauthenticated access should fail
    try:
        response = requests.get(f"{base_url}/projects", timeout=5)
        print(f"❌ Unauthenticated access: {response.status_code} - Expected 401")
        if response.status_code != 401:
            print(f"Response: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Error testing unauthenticated access: {e}")
        return
    
    # Test login
    try:
        login_data = {"password": "research_system_2025"}
        response = requests.post(
            f"{base_url}/auth/login", 
            json=login_data,
            timeout=5
        )
        
        if response.status_code == 200:
            token = response.json().get("token")
            print(f"✅ Login successful, token: {token[:20]}...")
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return
    except requests.exceptions.RequestException as e:
        print(f"❌ Error testing login: {e}")
        return
    
    # Test authenticated access
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{base_url}/projects", headers=headers, timeout=5)
        
        if response.status_code == 200:
            projects = response.json()
            print(f"✅ Authenticated access successful, found {len(projects)} projects")
        else:
            print(f"❌ Authenticated access failed: {response.status_code} - {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Error testing authenticated access: {e}")
    
    # Test auth key generation if we have projects
    if projects:
        try:
            project_id = projects[0]["id"]
            response = requests.post(
                f"{base_url}/projects/{project_id}/auth-key", 
                headers=headers,
                timeout=5
            )
            
            if response.status_code == 200:
                auth_key = response.json().get("key")
                print(f"✅ Auth key generation successful: {auth_key[:30]}...")
                
                # Test decode
                import base64
                decoded = base64.b64decode(auth_key).decode()
                print(f"✅ Decoded key: {decoded}")
            else:
                print(f"❌ Auth key generation failed: {response.status_code} - {response.text}")
        except requests.exceptions.RequestException as e:
            print(f"❌ Error testing auth key generation: {e}")

if __name__ == "__main__":
    test_auth()