import os
import shutil
import random

# Paths
images_path = "dataset/images"
labels_path = "dataset/labels"

# Create train/val directories
for folder in ["train", "val"]:
    os.makedirs(os.path.join(images_path, folder), exist_ok=True)
    os.makedirs(os.path.join(labels_path, folder), exist_ok=True)

# List all image files
all_images = [f for f in os.listdir(images_path) if f.endswith(".jpg") or f.endswith(".png")]

# Shuffle images randomly
random.shuffle(all_images)

# Train – validation split
split_ratio = 0.8
split_index = int(len(all_images) * split_ratio)

train_images = all_images[:split_index]
val_images = all_images[split_index:]

# Move images and labels
for img_list, folder in [(train_images, "train"), (val_images, "val")]:
    for img_file in img_list:
        # Move image
        shutil.move(os.path.join(images_path, img_file), os.path.join(images_path, folder, img_file))
        
        # Move corresponding label if it exists
        label_file = img_file.replace(".jpg", ".txt").replace(".png", ".txt")
        src_label = os.path.join(labels_path, label_file)
        dst_label = os.path.join(labels_path, folder, label_file)
        if os.path.exists(src_label):
            shutil.move(src_label, dst_label)
        else:
            print(f"⚠ Label not found for image: {img_file}")

print("✅ Train–test split completed successfully!")
