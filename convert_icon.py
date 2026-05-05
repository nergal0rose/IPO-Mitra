from PIL import Image
import sys

try:
    img = Image.open('icon.png')
    # Resize keeping aspect ratio if needed, but ico can handle it
    img.save('icon.ico', format='ICO', sizes=[(256, 256), (128, 128), (64, 64), (32, 32), (16, 16)])
    print("Successfully converted icon.png to icon.ico")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
