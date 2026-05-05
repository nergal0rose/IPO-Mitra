"""
Backend entry point when packaged with PyInstaller.
Electron launches this as a subprocess. This just runs FastAPI/uvicorn on port 8000.
"""
import os
import sys
import multiprocessing
import traceback

def get_data_dir():
    """Writable directory next to the .exe for meroshare.db"""
    if getattr(sys, 'frozen', False):
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.abspath(__file__))

if __name__ == "__main__":
    multiprocessing.freeze_support()

    data_dir = get_data_dir()
    os.chdir(data_dir)

    # Flush stdout so Electron can read backend output in real time
    sys.stdout.reconfigure(line_buffering=True)
    sys.stderr.reconfigure(line_buffering=True)

    print(f"[desktop_app] CWD: {os.getcwd()}", flush=True)
    print(f"[desktop_app] Frozen: {getattr(sys, 'frozen', False)}", flush=True)

    try:
        from main import app
        import uvicorn
        print("[desktop_app] Starting uvicorn on 127.0.0.1:8000", flush=True)
        uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
    except Exception:
        err = traceback.format_exc()
        print(f"[desktop_app] CRASH:\n{err}", flush=True)
        # Also write to crash log next to exe
        try:
            with open(os.path.join(data_dir, "server_crash.log"), "w") as f:
                f.write(err)
        except:
            pass
        sys.exit(1)
