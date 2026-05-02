import requests
import json
import sys
import os

BASE_URL = "https://webbackend.cdsc.com.np/api/meroShare"
HEADERS_BASE = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/plain, */*",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Origin": "https://meroshare.cdsc.com.np",
    "Referer": "https://meroshare.cdsc.com.np/",
    "Accept-Language": "en-US,en;q=0.9",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site",
}

class MeroShareAPI:
    def __init__(self, dp_id, username, password, crn, pin, bank_name=None):
        self.dp_id = dp_id
        self.username = username
        self.password_raw = password
        self.crn = crn
        self.pin_raw = pin
        self.target_bank_name = bank_name  # used to select the right bank if multiple linked
        self.token = None
        self.bank_id = None
        self.bank_account_number = None
        self.account_branch_id = None
        self.account_type_id = None
        self.own_detail = None

    def _headers(self):
        h = {**HEADERS_BASE}
        if self.token:
            h["Authorization"] = self.token
        return h

    def _safe_json(self, r):
        try:
            if r.text and r.text.strip():
                return r.json()
        except: pass
        return None

    def login(self) -> tuple[bool, str]:
        url = f"{BASE_URL}/auth/"
        payload = {
            "clientId": self.dp_id,
            "username": self.username,
            "password": self.password_raw,
        }
        try:
            r = requests.post(url, json=payload, headers=HEADERS_BASE, timeout=15)
            print(f"LOGIN ATTEMPT: {self.username} @ {self.dp_id}")
            print(f"LOGIN RESPONSE [{r.status_code}]: {r.text[:200]}")
            if r.status_code == 200:
                self.token = r.headers.get("Authorization")
                return True, ""
            
            err = f"HTTP {r.status_code}"
            try:
                err_data = r.json()
                if "message" in err_data:
                    err = err_data["message"]
            except: pass
            
            return False, err
        except Exception as e:
            print(f"LOGIN EXCEPTION: {e}")
            return False, str(e)

    def get_own_detail(self) -> dict | None:
        try:
            r = requests.get(f"{BASE_URL}/ownDetail/", headers=self._headers(), timeout=10)
            if r.status_code == 200:
                self.own_detail = self._safe_json(r)
                return self.own_detail
        except: pass
        return None

    def get_bank_detail(self) -> bool:
        try:
            r = requests.get(f"{BASE_URL}/bank/", headers=self._headers(), timeout=10)
            if r.status_code == 200:
                banks = self._safe_json(r)
                if banks and isinstance(banks, list):
                    # If a target bank name is set, try to match it
                    bank = banks[0]  # default to first
                    if self.target_bank_name and len(banks) > 1:
                        target = self.target_bank_name.lower()
                        for b in banks:
                            if target in b.get("name", "").lower() or b.get("name", "").lower() in target:
                                bank = b
                                break
                    self.bank_id = bank.get("id")
                    r2 = requests.get(f"{BASE_URL}/bank/{self.bank_id}/", headers=self._headers(), timeout=10)
                    if r2.status_code == 200:
                        detail = self._safe_json(r2)
                        if isinstance(detail, list) and detail: detail = detail[0]
                        if isinstance(detail, dict):
                            self.bank_account_id = detail.get("id")
                            self.bank_account_number = detail.get("accountNumber")
                            self.account_branch_id = detail.get("accountBranchId")
                            self.account_type_id = detail.get("accountTypeId")
                            return True
        except: pass
        return False

    def get_open_ipos(self) -> list:
        """Fetch all currently open issues via POST /companyShare/currentIssue/"""
        url = f"{BASE_URL}/companyShare/currentIssue/"
        payload = {
            "filterFieldParams": [],
            "page": 1, "size": 50,
            "searchRoleViewConstants": "VIEW_APPLICABLE_SHARE",
            "filterDateParams": []
        }
        try:
            r = requests.post(url, json=payload, headers=self._headers(), timeout=15)
            if r.status_code == 200:
                data = self._safe_json(r)
                if isinstance(data, dict):
                    return data.get("object", [])
                return data if isinstance(data, list) else []
        except: pass
        return []

    def get_applicable_ipos(self) -> list:
        """Fetch IPOs this account can apply for via POST /companyShare/applicableIssue/"""
        url = f"{BASE_URL}/companyShare/applicableIssue/"
        payload = {
            "filterFieldParams": [],
            "page": 1, "size": 50,
            "searchRoleViewConstants": "VIEW_APPLICABLE_SHARE",
            "filterDateParams": []
        }
        try:
            r = requests.post(url, json=payload, headers=self._headers(), timeout=15)
            if r.status_code == 200:
                data = self._safe_json(r)
                if isinstance(data, dict):
                    return data.get("object", [])
                return data if isinstance(data, list) else []
        except: pass
        return []

    def get_active_applicable_ipos(self) -> list:
        url = f"{BASE_URL}/applicantForm/active/search/"
        payload = {
            "filterFieldParams": [],
            "page": 1, "size": 50,
            "searchRoleViewConstants": "VIEW_APPLICANT_FORM_COMPLETE",
            "filterDateParams": []
        }
        try:
            r = requests.post(url, json=payload, headers=self._headers(), timeout=10)
            if r.status_code == 200:
                data = self._safe_json(r)
                if isinstance(data, dict):
                    return data.get("content", data.get("object", []))
                return data if isinstance(data, list) else []
        except: pass
        return []

    def apply_ipo(self, ipo: dict, kitta: int, dry_run: bool = False) -> dict:
        company_name = ipo.get("companyName", "Unknown")
        share_id = ipo.get("id") or ipo.get("companyShareId")

        if dry_run:
            return {"status": "DRY_RUN", "message": f"Would apply {kitta} kitta for {company_name}"}

        # Eligibility cross-check: verify this IPO is actually applicable
        applicable = self.get_applicable_ipos()
        is_ok = False
        for entry in applicable:
            if entry.get("companyShareId") == share_id:
                is_ok = True
                break
        if not is_ok:
            # Also check currently open issues
            open_ipos = self.get_open_ipos()
            for entry in open_ipos:
                if entry.get("companyShareId") == share_id:
                    is_ok = True
                    break
        if not is_ok and applicable:
            # Only reject if we actually got data from MeroShare (non-empty list)
            return {"status": "FAILED", "message": f"{company_name} not available for this account."}

        # Check if already applied
        try:
            past_apps = self.get_application_status()
            for app in past_apps:
                app_share_id = app.get("companyShareId") or app.get("companyShare", {}).get("id")
                if str(app_share_id) == str(share_id):
                    return {"status": "ALREADY_APPLIED", "message": "Already Applied"}
        except:
            pass

        if not self.account_branch_id: self.get_bank_detail()
        if not self.own_detail: self.get_own_detail()

        payload = {
            "accountBranchId": self.account_branch_id,
            "accountNumber": self.bank_account_number,
            "accountTypeId": self.account_type_id,
            "appliedKitta": str(kitta),
            "bankId": str(self.bank_id),
            "boid": self.own_detail.get("boid") if self.own_detail else None,
            "companyShareId": str(share_id),
            "crnNumber": self.crn.strip() if self.crn else "",
            "customerId": getattr(self, "bank_account_id", self.own_detail.get("id") if self.own_detail else None),
            "demat": self.own_detail.get("demat") if self.own_detail else None,
            "transactionPIN": self.pin_raw,
        }

        try:
            r = requests.post(f"{BASE_URL}/applicantForm/share/apply", json=payload, headers=self._headers(), timeout=15)
            print(f"APPLY RESPONSE [{r.status_code}]: {r.text[:300]}")
            
            if r.status_code in (200, 201) and "Request Rejected" not in r.text:
                resp_data = self._safe_json(r)
                msg = resp_data.get("message", "Application submitted successfully") if resp_data else "Application submitted"
                if "already" in msg.lower():
                    return {"status": "ALREADY_APPLIED", "message": msg}
                return {"status": "SUCCESS", "message": msg}
            
            if "Request Rejected" in r.text or r.status_code == 403:
                return {"status": "FAILED", "message": "API Blocked by MeroShare WAF."}

            if r.status_code == 409:
                return {"status": "ALREADY_APPLIED", "message": "Already Applied"}

            err = r.text[:300]
            try:
                err_data = r.json()
                if isinstance(err_data, list) and err_data and "message" in err_data[0]:
                    err = err_data[0]["message"]
                elif "message" in err_data:
                    err = err_data["message"]
            except: pass
            
            if "already" in err.lower():
                return {"status": "ALREADY_APPLIED", "message": "Already Applied"}
            return {"status": "FAILED", "message": err}
        except Exception as e:
            return {"status": "FAILED", "message": str(e)}

    def get_application_status(self, page: int = 1, size: int = 200) -> list:
        payload = {
            "filterFieldParams": [
                {"key": "companyShare.companyIssue.companyISIN.script", "alias": "Scrip"},
                {"key": "companyShare.companyIssue.companyISIN.company.name", "alias": "Company Name"}
            ],
            "page": page, "size": size,
            "searchRoleViewConstants": "VIEW_APPLICANT_FORM_COMPLETE",
            "filterDateParams": [
                {"key": "appliedDate", "condition": "", "alias": "", "value": ""},
                {"key": "appliedDate", "condition": "", "alias": "", "value": ""}
            ]
        }
        try:
            r = requests.post(f"{BASE_URL}/applicantForm/active/search/", json=payload, headers=self._headers(), timeout=10)
            if r.status_code == 200:
                data = self._safe_json(r)
                if isinstance(data, dict):
                    return data.get("content", data.get("object", []))
                return data if isinstance(data, list) else []
        except: pass
        return []

    def get_application_detail(self, form_id: int) -> dict:
        try:
            r = requests.get(f"{BASE_URL}/applicantForm/report/detail/{form_id}", headers=self._headers(), timeout=10)
            if r.status_code == 200:
                return self._safe_json(r)
        except: pass
        return {}


