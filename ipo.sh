#!/usr/bin/env bash
# ─────────────────────────────────────────────
#  ipo — MeroShare IPO automation shortcut
#  Usage:
#    ipo              → list open IPOs
#    ipo apply        → apply for all accounts
#    ipo apply --dry  → dry run (no submission)
#    ipo status       → check allotment status
#
#  Setup (run once):
#    chmod +x ipo.sh
#    cp ipo.sh ~/bin/ipo          # or any folder in your $PATH
#    # OR add alias to ~/.bashrc:
#    echo "alias ipo='bash ~/meroshare_ipo/ipo.sh'" >> ~/.bashrc
#    source ~/.bashrc
# ─────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON=$(command -v python3 || command -v python)

if [ -z "$PYTHON" ]; then
  echo "❌ Python not found. Install Python 3.10+ first."
  exit 1
fi

CMD="${1:-list}"
EXTRA="${2:-}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🇳🇵  MeroShare IPO Tool  |  $(date '+%Y-%m-%d %H:%M')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

case "$CMD" in
  list)
    "$PYTHON" "$SCRIPT_DIR/meroshare.py" list
    ;;
  apply)
    if [ "$EXTRA" = "--dry" ]; then
      echo "  [DRY RUN — no actual submission]"
      echo ""
      "$PYTHON" "$SCRIPT_DIR/meroshare.py" apply --dry
    else
      echo "  ⚠️  This will SUBMIT applications for all accounts."
      read -p "  Continue? (y/N) " confirm
      echo ""
      if [[ "$confirm" =~ ^[Yy]$ ]]; then
        "$PYTHON" "$SCRIPT_DIR/meroshare.py" apply
      else
        echo "  Cancelled."
      fi
    fi
    ;;
  status)
    "$PYTHON" "$SCRIPT_DIR/meroshare.py" status
    ;;
  schedule)
    echo "  Starting daily scheduler (Ctrl+C to stop)..."
    echo ""
    "$PYTHON" "$SCRIPT_DIR/scheduler.py"
    ;;
  help|--help|-h)
    echo "  Usage: ipo [list|apply|apply --dry|status|schedule]"
    echo ""
    echo "  list       Show currently open IPOs"
    echo "  apply      Apply for all accounts (asks confirmation)"
    echo "  apply --dry  Preview without submitting"
    echo "  status     Check application and allotment status"
    echo "  schedule   Start the daily auto-apply scheduler"
    echo ""
    ;;
  *)
    echo "  Unknown command: $CMD"
    echo "  Run 'ipo help' for usage."
    ;;
esac

echo ""
