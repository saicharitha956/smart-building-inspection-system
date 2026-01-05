import cv2
import numpy as np

mask_path = "MDMCS A Benchmark Dataset for Multi-Damage Monitor/MDMCS A Benchmark Dataset for Multi-Damage Monitor/HRCDS/HRCDS/train_mask"

mask_file = "train_0001_mask.png"  # use a file name that exists

mask = cv2.imread(f"{mask_path}/{mask_file}", cv2.IMREAD_UNCHANGED)

print("Mask shape:", mask.shape)
print("Unique values:", np.unique(mask))
