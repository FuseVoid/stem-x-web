import sys
import subprocess
import os

try:
    from PIL import Image, ImageDraw, ImageFont, ImageFilter
except ImportError:
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'Pillow'])
    from PIL import Image, ImageDraw, ImageFont, ImageFilter

input_img = "/Users/fusesamurai/.gemini/antigravity/brain/20fab20a-5334-48ba-91db-c76e33427a10/stem_x_og_preview_1785519047124.jpg"
output_dir = "/Users/fusesamurai/Desktop/STEM_X_INSTAGRAM_ASSETS"
os.makedirs(output_dir, exist_ok=True)

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

def get_font(size):
    try:
        return ImageFont.truetype(selected_font_path, size)
    except:
        return ImageFont.load_default()

# Open the original image
source_img = Image.open(input_img).convert("RGBA")
s_width, s_height = source_img.size

# Background color sampling from top-left corner
bg_color = source_img.getpixel((10, 10))

def create_social_asset(name, target_width, target_height):
    # Create background canvas
    canvas = Image.new("RGBA", (target_width, target_height), bg_color)
    
    # Resize source image to fit width
    ratio = target_width / s_width
    new_height = int(s_height * ratio)
    resized_img = source_img.resize((target_width, new_height), Image.LANCZOS)
    
    # Calculate vertical position (center)
    y_offset = (target_height - new_height) // 2
    
    # Paste resized image onto canvas
    canvas.paste(resized_img, (0, y_offset), resized_img)
    
    draw = ImageDraw.Draw(canvas)
    
    # Calculate text sizes based on target width
    title_size = int(target_width * 0.12)
    subtitle_size = int(target_width * 0.04)
    logo_size = int(target_width * 0.035)
    
    font_title = get_font(title_size)
    font_subtitle = get_font(subtitle_size)
    font_logo = get_font(logo_size)
    
    # Draw texts
    # Logo at top
    draw.text((50, 50), "FUSE VOID", fill=(255, 255, 255, 180), font=font_logo)
    
    # App Store badge at top right
    draw.text((target_width - 250, 50), "APPLE APP STORE", fill=(255, 255, 255, 180), font=font_logo)
    
    # Main Titles (Bottom area or Top area depending on aspect ratio)
    if target_height > target_width: # Story/Reel (Vertical)
        title_y = y_offset + new_height + 100
        # If it doesn't fit at bottom, move to top
        if title_y + 200 > target_height:
            title_y = y_offset - 200
    else: # Square
        title_y = y_offset + new_height + 50
        
    # Draw "STEM-X" centered
    try:
        title_bbox = draw.textbbox((0,0), "STEM-X", font=font_title)
        title_w = title_bbox[2] - title_bbox[0]
    except AttributeError:
        title_w, _ = draw.textsize("STEM-X", font=font_title)
        
    draw.text(((target_width - title_w)/2, title_y), "STEM-X", fill=(255, 255, 255, 255), font=font_title)
    
    # Draw Subtitle centered
    subtitle_text = "NEURAL AUDIO SEPARATION ENGINE"
    try:
        sub_bbox = draw.textbbox((0,0), subtitle_text, font=font_subtitle)
        sub_w = sub_bbox[2] - sub_bbox[0]
    except AttributeError:
        sub_w, _ = draw.textsize(subtitle_text, font=font_subtitle)
        
    draw.text(((target_width - sub_w)/2, title_y + title_size + 20), subtitle_text, fill=(0, 243, 255, 255), font=font_subtitle)
    
    # Convert and save
    out_path = os.path.join(output_dir, f"{name}.jpg")
    canvas.convert("RGB").save(out_path, quality=95)
    print(f"Created {name} at {out_path}")

# Generate Instagram formats
print("Generating Instagram Assets...")
create_social_asset("Instagram_Post_1080x1080", 1080, 1080)
create_social_asset("Instagram_Story_Reel_1080x1920", 1080, 1920)
print("Done!")
