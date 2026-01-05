import os

label_dir = "final_dataset/labels/train"

total = 0
empty = 0

for file in os.listdir(label_dir):
    if file.endswith(".txt"):
        total += 1
        path = os.path.join(label_dir, file)
        if os.path.getsize(path) == 0:
            empty += 1

print("Total label files:", total)
print("Empty label files:", empty)
