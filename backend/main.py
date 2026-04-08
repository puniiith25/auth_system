from fastapi import FastAPI, UploadFile, File, Form, Depends
import face_recognition_models
import os
os.environ["FACE_RECOGNITION_MODEL_LOCATION"] = os.path.dirname(face_recognition_models.__file__)
import face_recognition
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
import json
import numpy as np
import io
from database import SessionLocal
from auth import hash_password, verify_password, create_token
# fast api server

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/register")
async def register(
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        contents = await file.read()

        image = face_recognition.load_image_file(io.BytesIO(contents))
        encodings = face_recognition.face_encodings(image)

        if len(encodings) == 0:
            return {"error": "No face detected"}

        face_encoding = encodings[0].tolist()

        query = text("""
            INSERT INTO users_ai_ml (name, email, password, face_encoding)
            VALUES (:name, :email, :password, :face_encoding)
        """)

        db.execute(query, {
            "name": name,
            "email": email,
            "password": hash_password(password),
            "face_encoding": json.dumps(face_encoding)
        })
        db.commit()

        return {"message": "Registered successfully"}

    except Exception as e:
        return {"error": str(e)}

class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    try:
        user = db.execute(
            text("SELECT * FROM users_ai_ml WHERE email=:email"),
            {"email": data.email}
        ).fetchone()

        if not user:
            return {"error": "User not found"}

        if not verify_password(data.password, user[3]):
            return {"error": "Wrong password"}

        return {
            "message": "Password verified",
            "user_id": str(user[0])
        }


    except Exception as e:
        return {"error": str(e)}

@app.post("/verify-face")
async def verify_face(
    user_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        user = db.execute(
            text("SELECT * FROM users_ai_ml WHERE id=:id"),
            {"id": user_id}
        ).fetchone()
        if not user:
            return {"error": "User not found"}
        contents = await file.read()
        image = face_recognition.load_image_file(io.BytesIO(contents))
        encodings = face_recognition.face_encodings(image)
        if len(encodings) == 0:
            return {"error": "No face detected"}
        input_encoding = encodings[0]
        stored_data = user[4]

        if isinstance(stored_data, str):
            stored_encoding = np.array(json.loads(stored_data))
        else:
            stored_encoding = np.array(stored_data)
        match = face_recognition.compare_faces(
            [stored_encoding],
            input_encoding,
            tolerance=0.5  # 🔥 better accuracy
        )

        if match[0]:
            token = create_token({"email": user[2]})
            return {"message": "Login success","user": {
        "name": user[1],
        "email": user[2]
    } ,"token": token}
        return {"error": "Face mismatch"}
    except Exception as e:
        return {"error": str(e)}
    