import requests
import re
r = requests.get('https://meroshare.cdsc.com.np/')
main_js = re.search(r'src="(main.[^"]+.js)"', r.text).group(1)
r2 = requests.get('https://meroshare.cdsc.com.np/' + main_js)
with open('main.js', 'w', encoding='utf-8') as f:
    f.write(r2.text)
