from fastapi import APIRouter, Depends, Header
from sqlmodel import Session, select
from database import get_session
from models import Account
from meroshare_api import MeroShareAPI
from crypto import decrypt

import requests
from bs4 import BeautifulSoup

router = APIRouter()

@router.get("/applicable")
def get_applicable_ipos(
    x_app_pin: str = Header(...),
    session: Session = Depends(get_session)
):
    accounts = session.exec(select(Account).where(Account.active == True)).all()
    
    applicable_ipos = []
    seen_ids = set()
    errors = []

    if not accounts:
        return []

    for acc in accounts:
        try:
            pw = decrypt(x_app_pin, acc.password)
            pin = decrypt(x_app_pin, acc.transaction_pin)
            ms_api = MeroShareAPI(acc.dp_id, acc.username, pw, acc.crn, pin)
            success, login_err = ms_api.login()
            if success:
                # Fetch applicable IPOs (POST /companyShare/applicableIssue/)
                issues = ms_api.get_applicable_ipos()
                
                for issue in issues:
                    issue_id = issue.get("companyShareId")
                    if issue_id and issue_id not in seen_ids:
                        applicable_ipos.append({
                            "id": issue_id,
                            "companyShareId": issue_id,
                            "companyName": issue.get("companyName"),
                            "closeDate": issue.get("issueCloseDate"),
                            "openDate": issue.get("issueOpenDate"),
                            "shareTypeName": issue.get("shareTypeName"),
                            "minUnit": issue.get("minUnit"),
                            "maxUnit": issue.get("maxUnit"),
                            "sharePrice": issue.get("sharePrice"),
                            "scrip": issue.get("scrip"),
                            "subGroup": issue.get("subGroup"),
                        })
                        seen_ids.add(issue_id)
                # Only need first successful account to discover IPOs
                break
            else:
                errors.append(f"{acc.name}: Login failed - {login_err}")
        except Exception as e:
            err_msg = f"{acc.name}: {str(e)}"
            print(f"Error for {acc.name}: {repr(e)}")
            errors.append(err_msg)
            continue

    return applicable_ipos

@router.get("/open")
def get_open_ipos():
    try:
        r = requests.get('https://cdsc.com.np/ipolist', timeout=15)
        soup = BeautifulSoup(r.text, 'html.parser')
        tables = soup.find_all('table')
        if not tables:
            return []
            
        rows = tables[0].find_all('tr')
        ipos = []
        for row in rows[1:]: # Skip header
            cols = row.find_all(['td', 'th'])
            if len(cols) >= 9:
                # S.N	Company Name	Issue Manager	Issued Unit	Number Of Application	Applied Unit	Amount	Open-Date	Close-Date	Last Update
                company_name = cols[1].text.strip()
                issued_unit = cols[3].text.strip()
                open_date = cols[7].text.strip()
                close_date = cols[8].text.strip()
                
                # Extract Share Type if it's in parenthesis
                share_type = "IPO"
                if "(" in company_name and ")" in company_name:
                    share_type_text = company_name.split("(")[-1].split(")")[0]
                    if "RIGHT" in share_type_text.upper():
                        share_type = "Right Share"
                    elif "DEBENTURE" in share_type_text.upper():
                        share_type = "Debenture"
                    elif "MUTUAL" in share_type_text.upper():
                        share_type = "Mutual Fund"
                    elif "IPO" in share_type_text.upper() or "LOCAL" in share_type_text.upper() or "FOREIGN" in share_type_text.upper():
                        share_type = share_type_text
                        
                ipos.append({
                    "id": cols[0].text.strip(),
                    "companyName": company_name,
                    "closeDate": close_date,
                    "openDate": open_date,
                    "shareTypeName": share_type,
                    "issuedUnit": issued_unit,
                    "sharePrice": 100, # Not provided cleanly by the public API, default used
                    "minUnit": 10 # Default
                })
        return ipos
    except Exception as e:
        print("CDSC Scrape Error:", e)
        return []

@router.get("/calendar")
def get_upcoming_ipos():
    import re
    url = "https://www.sharesansar.com/upcoming-issue"
    headers = {"User-Agent": "Mozilla/5.0", "X-Requested-With": "XMLHttpRequest"}
    upcoming = []
    
    type_mapping = {
        1: "IPO", 
        2: "FPO", 
        3: "Right Share", 
        4: "Mutual Fund",
        5: "IPO (Local)",
        7: "Bonds/Debentures"
    }
    
    for type_id, type_name in type_mapping.items():
        try:
            r = requests.get(url, params={"type": type_id, "draw": 1, "start": 0, "length": 50}, headers=headers, timeout=10)
            data = r.json().get("data", [])
            for item in data:
                company = ""
                symbol = ""
                # Parse deeply nested HTML <a> tags in JSON
                if isinstance(item.get("company"), dict):
                    raw_name = item["company"].get("companyname", "")
                    company = re.sub(r'<[^>]*>', '', raw_name)
                    raw_sym = item["company"].get("symbol", "")
                    symbol = re.sub(r'<[^>]*>', '', raw_sym)

                share_type = type_name
                
                upcoming.append({
                    "id": item.get("companyid", ""),
                    "companyName": company.strip() if company else item.get("company", ""),
                    "symbol": symbol.strip(),
                    "totalUnits": item.get("total_units", ""),
                    "amount": item.get("amount", ""),
                    "applicationDate": item.get("application_date", ""),
                    "sebonApprovalDate": item.get("date_sebon", ""),
                    "issueManager": item.get("issue_manager", ""),
                    "shareType": share_type
                })
        except Exception as e:
            print(f"Error scraping upcoming type {type_id}:", e)
            
    return upcoming
