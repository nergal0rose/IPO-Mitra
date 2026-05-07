"""
Backend entry point when packaged with PyInstaller.
Electron launches this as a subprocess. This just runs FastAPI/uvicorn on port 8000.
"""
import os
import sys
import multiprocessing
import traceback

def get_data_dir():
    """
    Persistent, writable data directory.
    Priority: IPO_MITRA_DATA_DIR env var (set by Electron) > fallback to script dir (dev).
    NEVER use sys.executable dir in frozen mode — that's inside resources/ and gets replaced on update.
    """
    env_dir = os.environ.get("IPO_MITRA_DATA_DIR")
    if env_dir:
        return env_dir
    # Dev mode fallback
    return os.path.dirname(os.path.abspath(__file__))

if __name__ == "__main__":
    multiprocessing.freeze_support()

    data_dir = get_data_dir()
    os.makedirs(data_dir, exist_ok=True)

    # Propagate to database.py so it uses the same directory
    os.environ["IPO_MITRA_DATA_DIR"] = data_dir

    # Flush stdout so Electron can read backend output in real time
    sys.stdout.reconfigure(line_buffering=True)
    sys.stderr.reconfigure(line_buffering=True)

    print(f"[desktop_app] Data dir: {data_dir}", flush=True)
    print(f"[desktop_app] DB path:  {os.path.join(data_dir, 'meroshare.db')}", flush=True)
    print(f"[desktop_app] Frozen:   {getattr(sys, 'frozen', False)}", flush=True)
    if getattr(sys, 'frozen', False):
        print(f"[desktop_app] Exe dir:  {os.path.dirname(sys.executable)}", flush=True)
        print(f"[desktop_app] MEIPASS:  {getattr(sys, '_MEIPASS', 'N/A')}", flush=True)

    try:
        from main import app
        import uvicorn
        print("[desktop_app] Starting uvicorn on 127.0.0.1:8000", flush=True)
        uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
    except Exception:
        err = traceback.format_exc()
        print(f"[desktop_app] CRASH:\n{err}", flush=True)
        try:
            with open(os.path.join(data_dir, "server_crash.log"), "w") as f:
                f.write(err)
        except:
            pass
        sys.exit(1)
