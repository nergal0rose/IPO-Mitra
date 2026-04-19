"""
MeroShare Scheduler
===================
Runs the IPO auto-apply job once per day at a set time.
Run this in the background: python scheduler.py

It will:
  - Check for open IPOs every morning
  - Auto-apply for all accounts if new IPOs are found
  - Log everything to meroshare_log.json
"""

import schedule
import time
import subprocess
import sys
from datetime import datetime

# Time to run each day (24h format, Nepal time)
RUN_AT = "09:30"

def job():
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    print(f"\n[{now}] Running IPO auto-apply...")
    result = subprocess.run(
        [sys.executable, "meroshare.py", "apply"],
        capture_output=False
    )
    print(f"[{now}] Done. Exit code: {result.returncode}")

print(f"📅 Scheduler started — will run daily at {RUN_AT}")
print("   Press Ctrl+C to stop\n")

schedule.every().day.at(RUN_AT).do(job)

# Run immediately on start so you can verify it works
job()

while True:
    schedule.run_pending()
    time.sleep(60)
