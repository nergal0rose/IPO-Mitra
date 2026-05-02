import sqlite3
conn = sqlite3.connect('meroshare.db')
conn.execute("UPDATE accounts SET crn='013201669721' WHERE id=1")
conn.commit()
print("Rasmita CRN updated to 013201669721")
