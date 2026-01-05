from ultralytics import YOLO

# Load trained model
model = YOLO("runs/train/smart_building5/weights/best.pt")

# Run prediction on validation images
model.predict(
    source="final_dataset/images/val",
    save=True,
    conf=0.25
)

