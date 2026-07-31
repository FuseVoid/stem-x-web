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

orbitron_path = os.path.join(output_dir, "Orbitron.ttf")

# Use macOS native UltraLight font for the subtitle to look sleek
inter_path = "/System/Library/Fonts/HelveticaNeue.ttc"

source_img = Image.open(input_img).convert("RGBA")
s_width, s_height = source_img.size

bg_color = (7, 7, 9, 255) # Sleek dark #070709

def draw_text_with_glow(canvas, text, font, position, fill_color, glow_color, glow_radius=15, spacing=0):
    glow_layer = Image.new("RGBA", canvas.size, (0,0,0,0))
    glow_draw = ImageDraw.Draw(glow_layer)
    
    x, y = position
    for char in text:
        try:
            bbox = glow_draw.textbbox((0,0), char, font=font)
            char_w = bbox[2] - bbox[0]
        except:
            char_w, _ = glow_draw.textsize(char, font=font)
            
        glow_draw.text((x, y), char, fill=glow_color, font=font)
        x += char_w + spacing
        
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=glow_radius))
    canvas.paste(glow_layer, (0,0), glow_layer)
    
    sharp_draw = ImageDraw.Draw(canvas)
    x, y = position
    for char in text:
        try:
            bbox = sharp_draw.textbbox((0,0), char, font=font)
            char_w = bbox[2] - bbox[0]
        except:
            char_w, _ = sharp_draw.textsize(char, font=font)
            
        sharp_draw.text((x, y), char, fill=fill_color, font=font)
        x += char_w + spacing

def get_text_width(text, font, spacing):
    temp = Image.new("RGBA", (1,1))
    d = ImageDraw.Draw(temp)
    w = 0
    for char in text:
        try:
            bbox = d.textbbox((0,0), char, font=font)
            w += bbox[2] - bbox[0] + spacing
        except:
            cw, _ = d.textsize(char, font=font)
            w += cw + spacing
    return w - spacing 

def create_social_asset(name, target_width, target_height):
    # Resize and crop to fill canvas (CSS object-fit: cover)
    target_ratio = target_width / target_height
    source_ratio = s_width / s_height
    
    if source_ratio > target_ratio:
        # Image is wider, scale by height
        new_height = target_height
        new_width = int(s_height * source_ratio * (target_height / s_height))
    else:
        # Image is taller, scale by width
        new_width = target_width
        new_height = int(s_width / source_ratio * (target_width / s_width))
        
    resized_img = source_img.resize((new_width, new_height), Image.LANCZOS)
    
    # Center crop
    left = (new_width - target_width) // 2
    top = (new_height - target_height) // 2
    right = left + target_width
    bottom = top + target_height
    
    canvas = resized_img.crop((left, top, right, bottom))
    
    # Fonts
    font_orbitron = ImageFont.truetype(orbitron_path, int(target_width * 0.08)) 
    font_orbitron_sm = ImageFont.truetype(orbitron_path, int(target_width * 0.025))
    
    # Try to load UltraLight for minimal look
    try:
        font_inter_light = ImageFont.truetype(inter_path, int(target_width * 0.035), index=2) # Index 2 is often UltraLight
    except:
        font_inter_light = ImageFont.truetype(inter_path, int(target_width * 0.035))
    
    # FUSE VOID Logo
    draw_text_with_glow(canvas, "FUSE VOID", font_orbitron_sm, (50, 50), (255,255,255,150), (0,0,0,0), 0, spacing=8)
    
    # Apple App Store text right top
    badge_w = get_text_width("APP STORE", font_orbitron_sm, 8)
    draw_text_with_glow(canvas, "APP STORE", font_orbitron_sm, (target_width - 50 - badge_w, 50), (255,255,255,100), (0,0,0,0), 0, spacing=8)
    
    # Place texts exactly in the center of the canvas ON TOP of the image
    total_text_height = int(target_width * 0.08) + 30 + int(target_width * 0.035)
    title_y = (target_height - total_text_height) // 2 - 50 # Shift slightly up for aesthetic balance
        
    # STEM-X Title (Glowing, Minimal White)
    title_text = "STEM-X"
    title_spacing = 15
    title_w = get_text_width(title_text, font_orbitron, title_spacing)
    title_x = (target_width - title_w) // 2
    
    draw_text_with_glow(canvas, title_text, font_orbitron, (title_x, title_y), (255,255,255,255), (255, 255, 255, 60), glow_radius=18, spacing=title_spacing)
    
    # Subtitle (Wide spaced, light, white)
    subtitle = "NEURAL AUDIO ENGINE"
    sub_spacing = 25 # Very wide cinematic spacing
    sub_w = get_text_width(subtitle, font_inter_light, sub_spacing)
    sub_x = (target_width - sub_w) // 2
    
    if sub_w > target_width - 100:
        font_inter_light = ImageFont.truetype(inter_path, int(target_width * 0.025), index=2)
        sub_w = get_text_width(subtitle, font_inter_light, sub_spacing)
        sub_x = (target_width - sub_w) // 2

    draw_text_with_glow(canvas, subtitle, font_inter_light, (sub_x, title_y + int(target_width * 0.08) + 30), (255, 255, 255, 180), (255, 255, 255, 40), glow_radius=15, spacing=sub_spacing)
    
    # Minimal badge bottom center
    badge = "HYBRID ARCHITECTURE // V4.0"
    badge_font = ImageFont.truetype(inter_path, int(target_width * 0.015))
    badge_spacing = 10
    badge_w = get_text_width(badge, badge_font, badge_spacing)
    badge_x = (target_width - badge_w) // 2
    
    draw_text_with_glow(canvas, badge, badge_font, (badge_x, target_height - 60), (255,255,255,100), (0,0,0,0), 0, spacing=badge_spacing)

    out_path = os.path.join(output_dir, f"{name}.jpg")
    canvas.convert("RGB").save(out_path, quality=100)
    print(f"Created elegant minimal asset: {out_path}")

print("Generating V4 (Cover + Overlay) Instagram Assets...")
create_social_asset("Instagram_Post_1080x1080_V4", 1080, 1080)
create_social_asset("Instagram_Story_Reel_1080x1920_V4", 1080, 1920)
print("Done!")
