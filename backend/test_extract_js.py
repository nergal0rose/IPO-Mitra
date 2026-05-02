import glob
for f in glob.glob("*.js"):
    with open(f, "r", encoding="utf-8") as file:
        content = file.read()
        if "accountBranchId" in content:
            idx = content.find("accountBranchId")
            print(f"File: {f}")
            print(content[max(0, idx-200) : min(len(content), idx+500)])
            print("-" * 50)
