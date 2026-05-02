import requests
import re
import sys

r = requests.get("https://meroshare.cdsc.com.np/")
html = r.text
js_files = re.findall(r'src="([^"]+\.js)"', html)
for js in js_files:
    if not js.startswith("http"):
        js = "https://meroshare.cdsc.com.np/" + js
    print(f"Downloading {js}...")
    r2 = requests.get(js)
    filename = js.split("/")[-1]
    with open(filename, "w", encoding="utf-8") as f:
        f.write(r2.text)
