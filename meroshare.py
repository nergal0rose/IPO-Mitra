"""
MeroShare IPO Automation
========================
Automates IPO listing, application, and status checking
for multiple family accounts on MeroShare (CDSC Nepal).

Usage:
  python meroshare.py list          # Show currently open IPOs
  python meroshare.py apply         # Apply all open IPOs for all accounts
  python meroshare.py status        # Check application status for all accounts
  python meroshare.py apply --dry   # Dry run (no actual application)
"""

import requests
import json
import sys
import time
from datetime import datetime
from pathlib import Path

# ---------------------------------------------
# CONFIGURATION — fill in your family accounts
# ─────────────────────────────────────────────

ACCOUNTS = [
    {
        "name": "Rasmita",
        "dp_id": 199,
        "username": "404161",
        "password": "Prakash7",
        "crn": "13201669721",
        "transaction_pin": "1905",
        "default_kitta": 10,
    },
]

# IPO-specific overrides (optional) — set kitta per company
# e.g. apply more units for a promising IPO
IPO_OVERRIDES = {
    # "Company Name Keyword": 20,   # e.g. "Nabil": 20
}

BASE_URL = "https://webbackend.cdsc.com.np/api/meroShare"
HEADERS_BASE = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/plain, */*",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Origin": "https://meroshare.cdsc.com.np",
    "Referer": "https://meroshare.cdsc.com.np/",
    "Accept-Language": "en-US,en;q=0.9",
}

LOG_FILE = Path("meroshare_log.json")


# ---------------------------------------------
# API LAYER
# ─────────────────────────────────────────────

class MeroShareSession:
    def __init__(self, account: dict):
        self.account = account
        self.token = None
        self.bank_id = None
        self.bank_account_number = None
        self.own_detail = None

    def _headers(self):
        h = {**HEADERS_BASE}
        if self.token:
            h["Authorization"] = self.token
        return h

    def login(self) -> bool:
        """Authenticate and store token."""
        url = f"{BASE_URL}/auth/"
        payload = {
            "clientId": self.account["dp_id"],
            "username": self.account["username"],
            "password": self.account["password"],
        }
        try:
            r = requests.post(url, json=payload, headers=HEADERS_BASE, timeout=15)
            if r.status_code == 200:
                self.token = r.headers.get("Authorization")
                print(f"  [SUCCESS] [{self.account['name']}] Login successful")
                return True
            else:
                print(f"  [FAILED] [{self.account['name']}] Login failed: {r.status_code} --- {r.text[:200]}")
                return False
        except Exception as e:
            print(f"  [ERROR] [{self.account['name']}] Login error: {e}")
            return False

    def get_own_detail(self) -> dict | None:
        """Fetch user profile details."""
        r = requests.get(f"{BASE_URL}/ownDetail/", headers=self._headers(), timeout=10)
        if r.status_code == 200:
            self.own_detail = r.json()
            return self.own_detail
        return None

    def get_bank_detail(self) -> bool:
        """Fetch linked bank account (needed for IPO application)."""
        r = requests.get(f"{BASE_URL}/bank/", headers=self._headers(), timeout=10)
        if r.status_code == 200:
            banks = r.json()
            if banks:
                bank = banks[0]  # use first linked bank
                self.bank_id = bank.get("id")
                # Fetch account detail
                r2 = requests.get(
                    f"{BASE_URL}/bank/{self.bank_id}/",
                    headers=self._headers(), timeout=10
                )
                if r2.status_code == 200:
                    detail = r2.json()
                    self.bank_account_number = detail.get("accountNumber")
                    return True
        print(f"  [WARNING] [{self.account['name']}] Could not fetch bank details")
        return False

    def get_open_ipos(self) -> list:
        """Get all currently open IPOs/FPOs."""
        r = requests.get(f"{BASE_URL}/active/", headers=self._headers(), timeout=10)
        if r.status_code == 200:
            return r.json()
        return []

    def get_applicable_ipos(self) -> list:
        """Get IPOs this account can still apply for."""
        r = requests.get(f"{BASE_URL}/applicantForm/", headers=self._headers(), timeout=10)
        if r.status_code == 200:
            return r.json()
        return []

    def apply_ipo(self, ipo: dict, kitta: int, dry_run: bool = False) -> dict:
        """Apply for a single IPO."""
        company_name = ipo.get("companyName", "Unknown")
        share_id = ipo.get("id") or ipo.get("companyShareId")

        if dry_run:
            return {
                "status": "DRY_RUN",
                "message": f"Would apply {kitta} kitta for {company_name}"
            }

        payload = {
            "accountBranchId": ipo.get("accountBranchId"),
            "accountNumber": self.bank_account_number,
            "appliedKitta": str(kitta),
            "bankId": self.bank_id,
            "boid": self.own_detail.get("boid") if self.own_detail else None,
            "companyShareId": share_id,
            "crnNumber": self.account["crn"],
            "customerId": self.own_detail.get("id") if self.own_detail else None,
            "demat": self.own_detail.get("demat") if self.own_detail else None,
            "transactionPIN": self.account.get("transaction_pin", ""),
        }

        r = requests.post(
            f"{BASE_URL}/applicantForm/",
            json=payload,
            headers=self._headers(),
            timeout=15
        )

        if r.status_code == 200 or r.status_code == 201:
            return {"status": "SUCCESS", "message": r.json() if r.text else "Applied"}
        else:
            return {"status": "FAILED", "message": r.text[:300]}

    def get_application_status(self, page: int = 1, size: int = 200) -> list:
        """Get submitted IPO applications."""
        payload = {
            "filterFieldParams": [
                {"key": "companyShare.companyIssue.companyISIN.script", "alias": "Scrip"},
                {"key": "companyShare.companyIssue.companyISIN.company.name", "alias": "Company Name"}
            ],
            "page": page,
            "size": size,
            "searchRoleViewConstants": "VIEW_APPLICANT_FORM_COMPLETE",
            "filterDateParams": [
                {"key": "appliedDate", "condition": "", "alias": "", "value": ""},
                {"key": "appliedDate", "condition": "", "alias": "", "value": ""}
            ]
        }
        r = requests.post(
            f"{BASE_URL}/applicantForm/active/search/",
            json=payload,
            headers=self._headers(),
            timeout=10
        )
        if r.status_code == 200:
            data = r.json()
            if isinstance(data, dict):
                return data.get("content", data.get("object", []))
            return data if isinstance(data, list) else []
        return []

    def check_allotment(self, company_share_id: int) -> dict | None:
        """Check allotment result for a specific IPO."""
        r = requests.get(
            f"{BASE_URL}/applicantForm/submitted/applicantSpecific/{company_share_id}/",
            headers=self._headers(),
            timeout=10
        )
        if r.status_code == 200:
            return r.json()
        return None


# ---------------------------------------------
# OPERATIONS
# ─────────────────────────────────────────────

def determine_kitta(company_name: str, default_kitta: int) -> int:
    """Check IPO_OVERRIDES for custom kitta amount."""
    for keyword, kitta in IPO_OVERRIDES.items():
        if keyword.lower() in company_name.lower():
            return kitta
    return default_kitta


def cmd_list():
    """List all open IPOs using the first account."""
    print("\n[INFO] Fetching currently open IPOs...\n")
    acc = ACCOUNTS[0]
    session = MeroShareSession(acc)
    if not session.login():
        return

    ipos = session.get_open_ipos()
    if not ipos:
        print("No open IPOs right now.")
        return

    print(f"{'#':<4} {'Company':<45} {'Type':<10} {'Close Date':<15} {'Price':>8}  {'Min Kitta':>10}")
    print("-" * 100)
    for i, ipo in enumerate(ipos, 1):
        name    = ipo.get("companyName", "N/A")[:44]
        typ     = ipo.get("shareTypeName", "IPO")[:9]
        closes  = ipo.get("closeDate", "N/A")[:14]
        price   = ipo.get("sharePrice", "N/A")
        min_k   = ipo.get("minUnit", 10)
        print(f"{i:<4} {name:<45} {typ:<10} {closes:<15} {str(price):>8}  {str(min_k):>10}")

    print(f"\nTotal: {len(ipos)} open IPO(s)\n")


def cmd_apply(dry_run: bool = False):
    """Apply for all open IPOs across all accounts."""
    mode = "DRY RUN" if dry_run else "LIVE"
    print(f"\n[APPLYING] Applying for IPOs [{mode}] --- {len(ACCOUNTS)} accounts\n")

    results = []
    timestamp = datetime.now().isoformat()

    for acc in ACCOUNTS:
        print(f"\n[USER] Account: {acc['name']}")
        session = MeroShareSession(acc)

        if not session.login():
            results.append({"account": acc["name"], "error": "Login failed"})
            continue

        session.get_own_detail()
        session.get_bank_detail()

        # Get IPOs this account can still apply to
        applicable = session.get_applicable_ipos()
        if not applicable:
            print(f"  [INFO] No applicable IPOs found for {acc['name']}")
            continue

        for ipo in applicable:
            company = ipo.get("companyName", "Unknown")
            share_id = ipo.get("id") or ipo.get("companyShareId")
            kitta = determine_kitta(company, acc["default_kitta"])

            print(f"  [APPLY] Applying: {company} ({kitta} kitta)...", end=" ", flush=True)
            result = session.apply_ipo(ipo, kitta, dry_run=dry_run)
            status = result.get("status")

            if status == "SUCCESS":
                print("[DONE] Applied!")
            elif status == "DRY_RUN":
                print(f"[DRY RUN] {result['message']}")
            else:
                print(f"[FAILED] {result['message']}")

            results.append({
                "timestamp": timestamp,
                "account": acc["name"],
                "company": company,
                "share_id": share_id,
                "kitta": kitta,
                "status": status,
                "message": str(result.get("message", "")),
            })

            time.sleep(1)  # gentle delay between applications

    # Save log
    log = []
    if LOG_FILE.exists():
        log = json.loads(LOG_FILE.read_text())
    log.extend(results)
    LOG_FILE.write_text(json.dumps(log, indent=2, ensure_ascii=False))
    print(f"\n[LOG] Log saved -> {LOG_FILE}")


def cmd_status():
    """Check IPO application status for all accounts."""
    print(f"\n[STATUS] Application Status --- {len(ACCOUNTS)} accounts\n")

    for acc in ACCOUNTS:
        print(f"\n[USER] {acc['name']}")
        session = MeroShareSession(acc)

        if not session.login():
            print("  [FAILED] Login failed")
            continue

        apps = session.get_application_status()
        if not apps:
            print("  No applications found.")
            continue

        print(f"  {'Company':<45} {'Scrip':<10} {'Status':<15}")
        print("  " + "-" * 75)
        for app in apps:
            company   = (app.get("companyName") or "N/A")[:44]
            scrip     = (app.get("scrip") or "N/A")[:9]
            status    = app.get("statusName") or "?"
            print(f"  {company:<45} {scrip:<10} {status:<15}")

        time.sleep(0.5)


# ---------------------------------------------
# ENTRY POINT
# ─────────────────────────────────────────────

if __name__ == "__main__":
    args = sys.argv[1:]

    if not args or args[0] == "list":
        cmd_list()
    elif args[0] == "apply":
        dry = "--dry" in args
        cmd_apply(dry_run=dry)
    elif args[0] == "status":
        cmd_status()
    else:
        print(__doc__)
