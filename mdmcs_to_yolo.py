import os
import cv2
import numpy as np

BASE_DIR = "MDMCS A Benchmark Dataset for Multi-Damage Monitor/MDMCS A Benchmark Dataset for Multi-Damage Monitor/HRCDS/HRCDS"
OUT_BASE = "dataset"

splits = ["train", "val", "test"]

# Mask values → YOLO class IDs
MASK_TO_CLASS = {
    1: 0,  # crack
    2: 1   # second damage
}

for split in splits:
    img_dir = os.path.join(BASE_DIR, f"{split}_image")
    mask_dir = os.path.join(BASE_DIR, f"{split}_mask")

    out_img_dir = os.path.join(OUT_BASE, "images", split)
    out_lbl_dir = os.path.join(OUT_BASE, "labels", split)

    os.makedirs(out_img_dir, exist_ok=True)
    os.makedirs(out_lbl_dir, exist_ok=True)

    for img_name in os.listdir(img_dir):
        if not img_name.lower().endswith(".jpg"):
            continue

        base = os.path.splitext(img_name)[0]          # train_0001
        mask_name = base + "_mask.png"                 # train_0001_mask.png

        img_path = os.path.join(img_dir, img_name)
        mask_path = os.path.join(mask_dir, mask_name)

        if not os.path.exists(mask_path):
            print("⚠️ Mask missing for:", img_name)
            continue

        image = cv2.imread(img_path)
        mask = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)

        h, w = mask.shape
        label_path = os.path.join(out_lbl_dir, base + ".txt")

        wrote = False
        with open(label_path, "w") as f:
            for mask_value, class_id in MASK_TO_CLASS.items():
                binary = np.where(mask == mask_value, 255, 0).astype("uint8")
                contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

                for cnt in contours:
                    x, y, bw, bh = cv2.boundingRect(cnt)
                    xc = (x + bw / 2) / w
                    yc = (y + bh / 2) / h
                    bw /= w
                    bh /= h
                    f.write(f"{class_id} {xc} {yc} {bw} {bh}\n")
                    wrote = True

        if not wrote:
            print("⚠️ No damage found in:", img_name)

        cv2.imwrite(os.path.join(out_img_dir, img_name), image)

print("✅ Conversion completed successfully")
