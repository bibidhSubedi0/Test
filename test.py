import os
import json
import requests

# Bug 1: mutable default argument - a classic Python footgun
def add_item(item, cart=[]):
    cart.append(item)
    return cart

# Bug 2: broad except swallows all errors silently
def load_config(path):
    try:
        with open(path) as f:
            return json.load(f)
    except:
        return {}

# Bug 3: == None instead of 'is None'
def get_user(user_id):
    user = fetch_from_db(user_id)
    if user == None:
        return {"error": "not found"}
    return user

# Bug 4: no timeout on external request (hangs forever if server is slow)
def fetch_data(url):
    response = requests.get(url)
    return response.json()

# Bug 5: hardcoded secret
API_KEY = "sk-prod-abc123verysecretkey"

def call_api(endpoint):
    headers = {"Authorization": f"Bearer {API_KEY}"}
    return requests.post(endpoint, headers=headers)

# Bug 6: integer division unintentionally truncates
def calculate_average(numbers):
    total = 0
    for n in numbers:
        total += n
    return total / len(numbers)  # crashes if numbers is empty

# Bug 7: modifying a list while iterating over it
def remove_negatives(numbers):
    for n in numbers:
        if n < 0:
            numbers.remove(n)
    return numbers

def fetch_from_db(user_id):
    # placeholder
    return None