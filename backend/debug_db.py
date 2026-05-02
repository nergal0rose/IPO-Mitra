import sqlite3
conn = sqlite3.connect('meroshare.db')
cursor = conn.cursor()

tables = cursor.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
print("Tables:", [t[0] for t in tables])

for t in tables:
    name = t[0]
    print(f"\n--- {name} ---")
    cols = cursor.execute(f"PRAGMA table_info({name})").fetchall()
    col_names = [c[1] for c in cols]
    print("Columns:", col_names)
    rows = cursor.execute(f"SELECT * FROM {name} LIMIT 10").fetchall()
    for r in rows:
        print(dict(zip(col_names, r)))
