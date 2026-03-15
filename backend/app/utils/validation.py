import re

def validate_email(email):
	if not email or len(email) > 255:
		return False
	
	email_regex = r'^[\w\.-]+@[\w\.-]+\.\w+$'
	return re.match(email_regex, email) is not None

def validate_username(username):
	if not username or len(username) < 3 or len(username) > 20:
		return False
	
	username_regex = r'^[a-zA-Z0-9_]+$'
	return re.match(username_regex, username) is not None

def validate_password(password):
	if not password or len(password) < 8:
		return False
	return True
