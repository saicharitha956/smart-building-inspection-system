import os
import shutil
import random

SOURCE_DIR = "Building_Dataset"
OUTPUT_DIR = "surface_split"
SPLIT_RATIO = 0.8

os.makedirs(OUTPUT_DIR, exist_ok=True)

for cls in os.listdir(SOURCE_DIR):
    cls_path = os.path.join(SOURCE_DIR, cls)

    if not os.path.isdir(cls_path):
        continue

    images = [f for f in os.listdir(cls_path)
              if f.lower().endswith(('.jpg', '.png', '.jpeg'))]

    if len(images) == 0:
        print(f"⚠ Skipping empty folder: {cls}")
        continue

    random.shuffle(images)
    split_idx = int(len(images) * SPLIT_RATIO)

    splits = {
        "train": images[:split_idx],
        "val": images[split_idx:]
    }

    for split, img_list in splits.items():
        out_dir = os.path.join(OUTPUT_DIR, split, cls)
        os.makedirs(out_dir, exist_ok=True)

        for img in img_list:
            shutil.copy(
                os.path.join(cls_path, img),
                os.path.join(out_dir, img)
            )

    print(f"✅ {cls}: {len(images)} images split")

print("🎉 Dataset 3 split completed successfully")
