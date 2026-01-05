from ultralytics import YOLO

# load YOLOv8 nano model
model = YOLO("yolov8n.pt")

# train the model
model.train(
    data="smart_building_data.yaml",
    epochs=20,
    imgsz=640,
    batch=16,
    project="runs/train",
    name="smart_building"
)
