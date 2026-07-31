import sys
import subprocess

# Install Pillow if not present
try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'Pillow'])
    from PIL import Image, ImageDraw, ImageFont

import os

# Paths
input_img = "/Users/fusesamurai/.gemini/antigravity/brain/20fab20a-5334-48ba-91db-c76e33427a10/stem_x_og_preview_1785519047124.jpg"
output_img = "/Users/fusesamurai/Desktop/FUSE VOID STEM-X-Web/stem-x-og.jpg"

print(f"Opening image: {input_img}")
# Open the generated image
img = Image.open(input_img).convert("RGBA")
width, height = img.size

# We want 1200x630. Let's resize and crop if necessary, or just draw on it.
# The AI generated a 16:9 image (likely 1024x576 or 1280x720). Let's resize to 1200x630 via center crop.
target_ratio = 1200 / 630
img_ratio = width / height

if img_ratio > target_ratio:
    # Image is wider
    new_width = int(target_ratio * height)
    left = (width - new_width) / 2
    right = width - left
    img = img.crop((left, 0, right, height))
elif img_ratio < target_ratio:
    # Image is taller
    new_height = int(width / target_ratio)
    top = (height - new_height) / 2
    bottom = height - top
    img = img.crop((0, top, width, bottom))

img = img.resize((1200, 630), Image.LANCZOS)
draw = ImageDraw.Draw(img)

# Try to find good fonts
font_paths = [
    "/System/Library/Fonts/HelveticaNeue.ttc",
    "/System/Library/Fonts/Supplemental/Arial Black.ttf",
    "/Library/Fonts/Arial.ttf"
]
selected_font_path = None
for fp in font_paths:
    if os.path.exists(fp):
        selected_font_path = fp
        break

try:
    font_large = ImageFont.truetype(selected_font_path, 90)
    font_medium = ImageFont.truetype(selected_font_path, 30)
    font_small = ImageFont.truetype(selected_font_path, 20)
    font_logo = ImageFont.truetype(selected_font_path, 24)
except Exception as e:
    print(f"Failed to load font: {e}")
    font_large = ImageFont.load_default()
    font_medium = ImageFont.load_default()
    font_small = ImageFont.load_default()
    font_logo = ImageFont.load_default()

# Overlay FUSE VOID top left
draw.text((50, 40), "FUSE VOID", fill=(255, 255, 255, 200), font=font_logo)

# Overlay STEM-X center left
draw.text((50, 260), "STEM-X", fill=(255, 255, 255, 255), font=font_large)
draw.text((50, 360), "NEURAL AUDIO ENGINE", fill=(0, 243, 255, 255), font=font_medium)

# Overlay Apple App Store top right
draw.text((1000, 45), "APP STORE", fill=(255, 255, 255, 200), font=font_small)

# Overlay HYBRID ARCHITECTURE bottom left
draw.text((50, 560), "HYBRID ARCHITECTURE // V4.0", fill=(0, 243, 255, 200), font=font_small)

# Convert back to RGB and save
img = img.convert("RGB")
img.save(output_img, quality=95)
print(f"Saved optimized OG image to {output_img}")
