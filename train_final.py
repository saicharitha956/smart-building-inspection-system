from ultralytics import YOLO

# Load base YOLOv8 model
model = YOLO("yolov8n.pt")

# Train on FINAL multi-damage dataset
model.train(
    data="final_data.yaml",
    epochs=30,          # ✅ reduced epochs
    imgsz=640,
    batch=16,
    name="final_multidamage",
    project="runs/train"
)
