import os

img_dir = "final_dataset/images/train"
label_dir = "final_dataset/labels/train"

removed = 0

for label_file in os.listdir(label_dir):
    label_path = os.path.join(label_dir, label_file)

    if os.path.getsize(label_path) == 0:
        img_name = label_file.replace(".txt", ".jpg")
        img_path = os.path.join(img_dir, img_name)

        if os.path.exists(label_path):
            os.remove(label_path)
        if os.path.exists(img_path):
            os.remove(img_path)

        removed += 1

print("Removed empty-label samples:", removed)
