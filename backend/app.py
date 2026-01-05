from flask import Flask, request, jsonify, render_template, send_file
from flask_cors import CORS
from ultralytics import YOLO
import os
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
import json
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from functools import wraps
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# MongoDB Connection
MONGO_URI = os.getenv('MONGO_URI')
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-this')

try:
    client = MongoClient(MONGO_URI)
    db = client.smart_building_db
    print("✅ Connected to MongoDB successfully!")
except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")
    print("Using in-memory storage (for demo)")
    db = None

# Load YOLO model
MODEL_PATH = "../runs/train/final_multidamage/weights/best.pt"
model = YOLO(MODEL_PATH)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ==================== JWT AUTH FUNCTIONS ====================
def create_token(user_id):
    """Create JWT token"""
    payload = {
        'user_id': str(user_id),
        'exp': datetime.utcnow().timestamp() + 86400  # 24 hours
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm='HS256')

def verify_token(token):
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=['HS256'])
        return payload
    except:
        return None

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]

        if not token:
            return jsonify({"error": "Token is missing!"}), 401

        try:
            data = verify_token(token)
            if not data:
                return jsonify({"error": "Token is invalid or expired!"}), 401

            # Get user from MongoDB
            if db is not None:
                user = db.users.find_one({"_id": ObjectId(data['user_id'])})
                if not user:
                    return jsonify({"error": "User not found!"}), 401

                # Convert ObjectId to string for JSON serialization
                user['_id'] = str(user['_id'])
                request.user = user
            else:
                # Demo user if MongoDB not connected
                request.user = {"_id": "demo", "email": "demo@example.com"}

        except Exception as e:
            return jsonify({"error": "Token verification failed!"}), 401

        return f(*args, **kwargs)
    return decorated

# ==================== AUTH ROUTES ====================
@app.route("/api/register", methods=["POST"])
def register():
    """Register new user"""
    try:
        data = request.json

        if not data.get("email") or not data.get("password") or not data.get("name"):
            return jsonify({"error": "Missing required fields"}), 400

        # Check if user exists
        if db is not None:
            existing_user = db.users.find_one({"email": data["email"]})
            if existing_user:
                return jsonify({"error": "Email already exists"}), 400

            # Create user
            user_data = {
                "name": data["name"],
                "email": data["email"],
                "password": generate_password_hash(data["password"]),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }

            result = db.users.insert_one(user_data)
            user_id = str(result.inserted_id)
        else:
            # Demo mode
            user_id = "demo_" + str(datetime.now().timestamp())

        # Create token
        token = create_token(user_id)

        return jsonify({
            "message": "User registered successfully",
            "token": token,
            "user": {
                "id": user_id,
                "name": data["name"],
                "email": data["email"]
            }
        }), 201

    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify({"error": "Registration failed"}), 500

@app.route("/api/login", methods=["POST"])
def login():
    """User login"""
    try:
        data = request.json

        if not data.get("email") or not data.get("password"):
            return jsonify({"error": "Email and password required"}), 400

        if db is not None:
            # Find user in MongoDB
            user = db.users.find_one({"email": data["email"]})

            if not user:
                return jsonify({"error": "Invalid credentials"}), 401

            # Verify password
            if not check_password_hash(user["password"], data["password"]):
                return jsonify({"error": "Invalid credentials"}), 401

            user_id = str(user["_id"])
            user_name = user["name"]
        else:
            # Demo mode - accept any password for demo@example.com
            if data["email"] == "demo@example.com":
                user_id = "demo_user"
                user_name = "Demo User"
            else:
                return jsonify({"error": "Invalid credentials"}), 401

        # Create token
        token = create_token(user_id)

        return jsonify({
            "message": "Login successful",
            "token": token,
            "user": {
                "id": user_id,
                "name": user_name,
                "email": data["email"]
            }
        })

    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({"error": "Login failed"}), 500

# ==================== PROFILE ROUTES ====================
@app.route("/api/profile", methods=["GET"])
@token_required
def get_profile():
    """Get user profile"""
    user = request.user
    # Remove password from response
    if "password" in user:
        del user["password"]
    return jsonify({"user": user})

@app.route("/api/profile", methods=["PUT"])
@token_required
def update_profile():
    """Update current user's profile details"""
    if db is None:
        return jsonify({"error": "Database not available"}), 500

    user = request.user
    data = request.json or {}

    update_fields = {}
    if "name" in data:
        update_fields["name"] = data["name"]
    if "email" in data:
        update_fields["email"] = data["email"]

    if not update_fields:
        return jsonify({"error": "No fields to update"}), 400

    try:
        db.users.update_one(
            {"_id": ObjectId(user["_id"])},
            {"$set": {**update_fields, "updated_at": datetime.utcnow()}}
        )

        updated = db.users.find_one({"_id": ObjectId(user["_id"])})
        updated["_id"] = str(updated["_id"])
        if "password" in updated:
            del updated["password"]

        return jsonify({
            "message": "Profile updated",
            "user": updated
        })
    except Exception as e:
        print("Profile update error:", e)
        return jsonify({"error": "Failed to update profile"}), 500

# ==================== MAIN ANALYSIS ENDPOINT (UPDATED FOR MONGODB) ====================
@app.route("/api/analyze", methods=["POST"])
@token_required
def analyze_image():
    """Analyze image and save to MongoDB"""
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    image = request.files["image"]
    user = request.user

    # Generate unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{timestamp}_{image.filename}"
    image_path = os.path.join(UPLOAD_FOLDER, filename)
    image.save(image_path)

    # SAFE CONFIDENCE
    results = model.predict(image_path, conf=0.20)

    detected = {}

    for r in results:
        if r.boxes is None:
            continue

        for c in r.boxes.cls:
            class_id = int(c)
            class_name = model.names[class_id]
            detected[class_name] = detected.get(class_name, 0) + 1

    print("Detected:", detected)

    # Severity logic
    count = sum(detected.values())
    if count == 0:
        severity = "Good"
    elif count <= 2:
        severity = "Moderate"
    else:
        severity = "Critical"

    # Health score logic
    penalties = {
        "crack": 12,
        "major_crack": 15,
        "minor_crack": 8,
        "spalling": 20,
        "peeling": 10,
        "algae": 5,
        "stain": 5,
        "normal": 0
    }

    score = 100
    for d, c in detected.items():
        score -= penalties.get(d, 0) * c
    score = max(score, 0)

    # Precautions
    precaution_map = {
        "crack": "Seal cracks early to prevent structural weakening.",
        "major_crack": "Immediate structural inspection and repair required.",
        "minor_crack": "Monitor cracks and apply sealant if needed.",
        "spalling": "Repair damaged concrete immediately to avoid further degradation.",
        "peeling": "Remove loose material and reapply protective coating.",
        "algae": "Clean surface and improve drainage to prevent moisture retention.",
        "stain": "Identify moisture source and clean affected area."
    }

    precautions = list({precaution_map[d] for d in detected if d in precaution_map})

    # Save to MongoDB
    inspection_data = {
        "user_id": user["_id"],
        "user_email": user.get("email", "unknown"),
        "image_filename": filename,
        "image_path": image_path,
        "detected_damages": detected,
        "severity": severity,
        "health_score": score,
        "precautions": precautions,
        "created_at": datetime.utcnow()
    }

    if db is not None:
        result = db.inspections.insert_one(inspection_data)
        inspection_id = str(result.inserted_id)
    else:
        inspection_id = f"demo_{timestamp}"

    return jsonify({
        "detected_damages": detected,
        "severity": severity,
        "health_score": score,
        "precautions": precautions,
        "inspection_id": inspection_id,
        "image_url": f"/api/images/{filename}"
    })

# ==================== GET USER INSPECTIONS ====================
@app.route("/api/inspections", methods=["GET"])
@token_required
def get_inspections():
    """Get all inspections for current user"""
    try:
        user = request.user

        if db is not None:
            inspections = list(
                db.inspections
                .find({"user_id": user["_id"]})
                .sort("created_at", -1)
                .limit(50)
            )

            # Convert ObjectId to string for JSON serialization
            for inspection in inspections:
                inspection["_id"] = str(inspection["_id"])
                # Convert datetime to string
                if isinstance(inspection.get("created_at"), datetime):
                    inspection["created_at"] = inspection["created_at"].isoformat()
        else:
            # Demo data
            inspections = [
                {
                    "_id": "demo_1",
                    "severity": "Moderate",
                    "health_score": 72,
                    "created_at": datetime.utcnow().isoformat(),
                    "detected_damages": {"minor_crack": 2, "stain": 1}
                }
            ]

        return jsonify({"inspections": inspections})

    except Exception as e:
        print(f"Error getting inspections: {e}")
        return jsonify({"error": "Failed to get inspections"}), 500

# ==================== IMAGE SERVING ====================
@app.route("/api/images/<filename>", methods=["GET"])
def serve_image(filename):
    """Serve uploaded images"""
    try:
        image_path = os.path.join(UPLOAD_FOLDER, filename)
        if os.path.exists(image_path):
            return send_file(image_path)
        else:
            return jsonify({"error": "Image not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==================== KEEP OLD ENDPOINT FOR COMPATIBILITY ====================
@app.route("/analyze", methods=["POST"])
def analyze_image_legacy():
    """Legacy endpoint for backward compatibility (no auth required)"""
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    image = request.files["image"]
    filename = f"legacy_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{image.filename}"
    image_path = os.path.join(UPLOAD_FOLDER, filename)
    image.save(image_path)

    results = model.predict(image_path, conf=0.20)

    detected = {}
    for r in results:
        if r.boxes is None:
            continue
        for c in r.boxes.cls:
            class_id = int(c)
            class_name = model.names[class_id]
            detected[class_name] = detected.get(class_name, 0) + 1

    # Severity logic
    count = sum(detected.values())
    if count == 0:
        severity = "Good"
    elif count <= 2:
        severity = "Moderate"
    else:
        severity = "Critical"

    # Health score logic
    penalties = {
        "crack": 12,
        "major_crack": 15,
        "minor_crack": 8,
        "spalling": 20,
        "peeling": 10,
        "algae": 5,
        "stain": 5,
        "normal": 0
    }

    score = 100
    for d, c in detected.items():
        score -= penalties.get(d, 0) * c
    score = max(score, 0)

    # Precautions
    precaution_map = {
        "crack": "Seal cracks early to prevent structural weakening.",
        "major_crack": "Immediate structural inspection and repair required.",
        "minor_crack": "Monitor cracks and apply sealant if needed.",
        "spalling": "Repair damaged concrete immediately to avoid further degradation.",
        "peeling": "Remove loose material and reapply protective coating.",
        "algae": "Clean surface and improve drainage to prevent moisture retention.",
        "stain": "Identify moisture source and clean affected area."
    }

    precautions = list({precaution_map[d] for d in detected if d in precaution_map})

    return jsonify({
        "detected_damages": detected,
        "severity": severity,
        "health_score": score,
        "precautions": precautions
    })

# ==================== ROOT ROUTES ====================
@app.route("/")
def home():
    return jsonify({
        "message": "Smart Building Inspection Backend",
        "version": "2.1",
        "mongodb": "connected" if db is not None else "demo_mode",
        "endpoints": {
            "auth": [
                "POST /api/register",
                "POST /api/login",
                "GET /api/profile",
                "PUT /api/profile"
            ],
            "inspections": ["POST /api/analyze", "GET /api/inspections"],
            "legacy": ["POST /analyze"]
        }
    })

@app.route("/api/inspections/<inspection_id>", methods=["DELETE"])
@token_required
def delete_inspection(inspection_id):
    """Delete a single inspection for the current user"""
    if db is None:
        return jsonify({"error": "Database not available"}), 500

    user = request.user
    try:
        result = db.inspections.delete_one({
            "_id": ObjectId(inspection_id),
            "user_id": user["_id"]
        })

        if result.deleted_count == 0:
            return jsonify({"error": "Inspection not found"}), 404

        return jsonify({"message": "Inspection deleted"})
    except Exception as e:
        print("Delete inspection error:", e)
        return jsonify({"error": "Failed to delete inspection"}), 500

@app.route("/test")
def test_page():
    return render_template("test.html")

# ==================== HEALTH CHECK ====================
@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "database": "connected" if db else "demo_mode",
        "model_loaded": True,
        "timestamp": datetime.utcnow().isoformat()
    })

if __name__ == "__main__":
    print("🚀 Starting Smart Building Inspection Backend with MongoDB...")
    print(f"📁 Upload folder: {UPLOAD_FOLDER}")
    print(f"🔗 MongoDB: {'Connected' if db is not None else 'Demo Mode'}")
    print(f"🤖 Model loaded: {model.names}")
    print("🌐 Server running on http://localhost:5000")
    print("\n📋 Available endpoints:")
    print("  POST /api/register     - Register new user")
    print("  POST /api/login        - User login")
    print("  GET  /api/profile      - Get profile")
    print("  PUT  /api/profile      - Update profile")
    print("  POST /api/analyze      - Analyze image (with auth)")
    print("  GET  /api/inspections  - Get user inspections")
    print("  POST /analyze          - Legacy endpoint (no auth)")

    app.run(debug=True, host='0.0.0.0', port=5000)