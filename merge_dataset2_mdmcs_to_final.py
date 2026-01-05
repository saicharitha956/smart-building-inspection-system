import os
import shutil

SRC = "dataset"          # MDMCS YOLO data
DST = "final_dataset"    # unified dataset

IMG_EXTS = [".jpg", ".png", ".jpeg"]

CLASS_REMAP = {
    0: 2,  # crack -> major_crack
    1: 3   # spalling -> spalling
}

for split in ["train", "val"]:
    src_img_dir = os.path.join(SRC, "images", split)
    src_lbl_dir = os.path.join(SRC, "labels", split)

    dst_img_dir = os.path.join(DST, "images", split)
    dst_lbl_dir = os.path.join(DST, "labels", split)

    os.makedirs(dst_img_dir, exist_ok=True)
    os.makedirs(dst_lbl_dir, exist_ok=True)

    for lbl_file in os.listdir(src_lbl_dir):
        if not lbl_file.endswith(".txt"):
            continue

        # find matching image
        img_file = None
        for ext in IMG_EXTS:
            cand = lbl_file.replace(".txt", ext)
            if os.path.exists(os.path.join(src_img_dir, cand)):
                img_file = cand
                break

        if img_file is None:
            continue

        # copy image with prefix
        new_img_name = "mdmcs_" + img_file
        shutil.copy(
            os.path.join(src_img_dir, img_file),
            os.path.join(dst_img_dir, new_img_name)
        )

        # remap labels
        new_lines = []
        with open(os.path.join(src_lbl_dir, lbl_file), "r") as f:
            for line in f:
                parts = line.strip().split()
                old_cls = int(parts[0])
                new_cls = CLASS_REMAP.get(old_cls, old_cls)
                new_lines.append(" ".join([str(new_cls)] + parts[1:]))

        new_lbl_name = new_img_name.rsplit(".", 1)[0] + ".txt"
        with open(os.path.join(dst_lbl_dir, new_lbl_name), "w") as f:
            f.write("\n".join(new_lines))

print("✅ Dataset-2 (MDMCS) merged into final_dataset successfully")
