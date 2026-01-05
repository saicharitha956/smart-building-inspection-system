from ultralytics import YOLO

model = YOLO("runs/train/final_multidamage/weights/best.pt")

results = model.predict(
    source="test_images",
    conf=0.25,
    save=True
)

print(model.names)
