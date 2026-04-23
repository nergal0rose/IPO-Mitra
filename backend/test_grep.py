import re
with open("upcoming.html", "r", encoding="utf-8") as f:
    text = f.read()

# Find anything that looks like quotes + ajax + quotes
matches = re.finditer(r'ajax', text)
for m in matches:
    start = max(0, m.start() - 50)
    end = min(len(text), m.end() + 150)
    print(text[start:end])
    print("-" * 40)
