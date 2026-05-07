# IPO Mitra

**IPO Mitra** is a comprehensive, full-stack automation and analytics platform designed to streamline operations on the MeroShare portal for the Nepalese stock market. It takes the hassle out of managing multiple MeroShare accounts by providing bulk application features, real-time IPO tracking, and consolidated reporting, all packaged within a modern, highly responsive user interface.

## 🚀 Key Features

* **Multi-Account Management**: Securely store and manage credentials for multiple MeroShare accounts in a local SQLite database.
* **Bulk IPO Applications**: Apply for upcoming Initial Public Offerings (IPOs), FPOs, Right Shares, and Mutual Funds across all registered accounts with a single click.
* **Smart Application Handling**: Robust automation that automatically detects "Already Applied" statuses, handles MeroShare API rate limits, and safely persists application outcomes.
* **Centralized Reporting**: A beautifully designed "Application Reports" dashboard that groups application statuses by company (IPO) rather than account, giving you a clear overview of application success and failures.
* **Live Market Data Integration**: Automated scrapers that pull the latest upcoming IPOs and instruments data from ShareSansar, providing real-time visibility into market opportunities.
* **Modern Dashboard**: Built with React and Tailwind CSS, featuring rich aesthetics, intuitive navigation, amber-styled feedback for duplicate applications, and smooth micro-animations.

## 🛠️ Technology Stack

**Backend**
* Python 3.x
* FastAPI (High-performance API framework)
* SQLite (Local database)
* Uvicorn (ASGI server)

**Frontend**
* React 19 (via Vite)
* Tailwind CSS (Styling and Design System)
* Lucide React (Icons)
* Recharts (Data visualization)

## ⚙️ Installation & Usage (End Users)

IPO Mitra is now a fully standalone Desktop Application! You do **not** need to install Python, Node.js, or run any scripts manually.

1. Go to the [Releases page](../../releases) on this GitHub repository.
2. Download the latest `IPO Mitra Setup X.X.X.exe` file.
3. Double-click the `.exe` to install it. It will automatically create a Desktop and Start Menu shortcut.
4. Launch "IPO Mitra", add your MeroShare accounts, and start automating!

*(Note: Windows SmartScreen may show a "Windows protected your PC" warning because this is a newly created app. Click "More info" and then "Run anyway" to proceed).*

## 🛠️ Developer Setup (Building from source)

If you want to modify the code and build your own installer:

### Prerequisites
* Python 3.10+ installed and added to PATH.
* Node.js (v18+) and npm installed.

### Build Instructions
1. **Clone the repository:**
   ```bash
   git clone https://github.com/nergal0rose/IPO-Mitra.git
   cd IPO-Mitra
   ```

2. **Build the Desktop Application:**
   Run the master build script which handles bundling the frontend, packaging the FastAPI backend with PyInstaller, and generating the NSIS installer via electron-builder:
   ```cmd
   .\build_electron.bat
   ```

3. **Output:**
   The final executable will be located at `release/IPO Mitra Setup 1.0.0.exe`.

## 📁 Project Structure

```text
IPO_Mitra/
├── backend/               # FastAPI backend source code (Python)
├── frontend/              # React/Vite frontend source code (JavaScript)
├── electron/              # Desktop wrapper and packaging config (Node.js)
├── build_electron.bat     # Master build script for generating the installer
└── icon.ico               # Application branding
```

## 🛡️ Privacy & Security
IPO Mitra is designed to run **locally** on your machine. MeroShare credentials, PINs, and transaction histories are stored locally in the `meroshare.db` SQLite file. 

In the packaged production build, your data is stored in:
`%APPDATA%\IPO Mitra\meroshare.db`

This ensures your data persists across app restarts, updates, and reinstalls. You can verify your storage paths by visiting `http://127.0.0.1:8000/api/debug/paths` while the app is running.

This data is never sent to any external server other than the official MeroShare APIs required for authentication and application submission.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📝 License
[MIT](LICENSE)
