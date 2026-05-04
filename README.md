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

## ⚙️ Installation & Usage

### Prerequisites
* Python 3.8+ installed and added to PATH.
* Node.js (v18+) and npm installed.

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/IPO_Mitra.git
   cd IPO_Mitra
   ```

2. **Launch the Application:**
   IPO Mitra includes a convenient Windows batch script that automatically installs dependencies for both backend and frontend, and starts the servers in the background.
   
   Simply double-click or run:
   ```cmd
   "IPO Mitra Launcher.bat"
   ```
   
   This will:
   - Install Python requirements (`pip install -r backend/requirements.txt`)
   - Install Node modules (`npm install` inside `frontend`)
   - Start the FastAPI backend on `http://localhost:8000`
   - Start the Vite React frontend on `http://localhost:5173`
   - Automatically open the dashboard in your default web browser.

3. **Stop the Application:**
   To gracefully shut down the background servers, run:
   ```cmd
   stop.bat
   ```

## 📁 Project Structure

```
IPO_Mitra/
├── backend/               # FastAPI backend source code
│   ├── main.py            # API entry point & routes registration
│   ├── database.py        # SQLite database connection setup
│   ├── routes/            # API endpoints (accounts, ipos, apply, reports)
│   └── requirements.txt   # Python dependencies
├── frontend/              # React/Vite frontend source code
│   ├── src/               # React components, pages, and API hooks
│   ├── package.json       # Node.js dependencies
│   └── vite.config.js     # Vite configuration
├── IPO Mitra Launcher.bat # One-click launch script
└── stop.bat               # Teardown script
```

## 🛡️ Privacy & Security
IPO Mitra is designed to run **locally** on your machine. MeroShare credentials, PINs, and transaction histories are stored locally in the `meroshare.db` SQLite file. This data is never sent to any external server other than the official MeroShare APIs required for authentication and application submission.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📝 License
[MIT](LICENSE)
