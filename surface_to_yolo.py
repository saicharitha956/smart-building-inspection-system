import os
import cv2

BASE_DIR = "surface_split"
OUT_DIR = "final_dataset"

CLASS_MAP = {
    "normal": 0,
    "minor_crack": 1,
    "major_crack": 2,
    "spalling": 3,
    "peeling": 4,
    "algae": 5,
    "stain": 6
}

for split in ["train", "val"]:
    img_out = os.path.join(OUT_DIR, "images", split)
    lbl_out = os.path.join(OUT_DIR, "labels", split)

    os.makedirs(img_out, exist_ok=True)
    os.makedirs(lbl_out, exist_ok=True)

    for cls_name, cls_id in CLASS_MAP.items():
        src_dir = os.path.join(BASE_DIR, split, cls_name)
        if not os.path.exists(src_dir):
            continue

        for img_name in os.listdir(src_dir):
            if not img_name.lower().endswith((".jpg", ".png", ".jpeg")):
                continue

            src_img = os.path.join(src_dir, img_name)
            img = cv2.imread(src_img)
            if img is None:
                continue

            h, w = img.shape[:2]

            # full-image bounding box
            xc, yc = 0.5, 0.5
            bw, bh = 1.0, 1.0

            new_name = f"{cls_name}_{img_name}"
            cv2.imwrite(os.path.join(img_out, new_name), img)

            label_path = os.path.join(lbl_out, new_name.rsplit(".", 1)[0] + ".txt")
            with open(label_path, "w") as f:
                f.write(f"{cls_id} {xc} {yc} {bw} {bh}\n")

print("✅ Dataset 3 converted to YOLO format successfully")
