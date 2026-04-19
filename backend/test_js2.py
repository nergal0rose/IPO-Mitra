import requests
import re
r = requests.get('https://meroshare.cdsc.com.np/')
main_js = re.search(r'src="(main.[^"]+.js)"', r.text).group(1)
r2 = requests.get('https://meroshare.cdsc.com.np/' + main_js)
matches = re.findall(r'(\.post|\.get|\.put)\s*\(\s*[^)]*(?:applicant|share|issue|apply)[^)]*\)', r2.text, re.IGNORECASE)
for m in set(matches):
    print(m[:100])
