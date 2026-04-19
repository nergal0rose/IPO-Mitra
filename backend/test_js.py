import requests
import re
r = requests.get('https://meroshare.cdsc.com.np/')
main_js = re.search(r'src="(main.[^"]+.js)"', r.text).group(1)
r2 = requests.get('https://meroshare.cdsc.com.np/' + main_js)
text = r2.text
# Let's search for apply POST string logic in the Angular JS
start = text.find('"POST"')
while start != -1:
    end = start + 500
    chunk = text[start-300:end]
    if 'applicantForm' in chunk:
        print(chunk)
        print('---')
    start = text.find('"POST"', start + 1)
