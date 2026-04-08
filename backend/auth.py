import bcrypt
from jose import jwt
import os

SECRET_KEY = os.getenv("SECRET_KEY")

def hash_password(password):
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password, hashed):
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(data):
    return jwt.encode(data, SECRET_KEY, algorithm="HS256")