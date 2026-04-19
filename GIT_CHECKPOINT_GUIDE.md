# Git Checkpoint & Revert Guide

Since we are using version control (Git), your project is completely safe. Whenever we "save to a safe point," we are creating a **Git Commit** (a checkpoint). 

Here is how you can view your history and travel back in time if something breaks:

## Method 1: Using VS Code's Timeline (Easiest)

Your code editor (VS Code) comes with a built-in time machine at the bottom of the left sidebar, called the **Timeline**.

1. **Open the file** you think is broken (for example, `App.jsx`).
2. **Expand the Timeline panel** in the bottom left corner.
3. **Click on a Checkpoint**: 
   - You will see items labeled "Checkpoint" or have our custom messages (e.g., *"UI: Increase text contrast..."*).
   - If you **click** on an item, it will open a split-screen view showing you exactly what the file looked like at that moment in the past, compared to what it looks like right now. Green shows what was added, red shows what was deleted.
4. **To Revert**: 
   - Simply right-click the old checkpoint in the Timeline and select **"Restore Contents"**.
   - This instantly rolls the file back to how it was on that exact date and time.

---

## Method 2: Using the Terminal (Advanced/Full Project Revert)

If you made a massive mistake across the entire application and want to wipe out all changes and go back to a safe point globally, use the terminal:

1. **View your Checkpoints:**
   Run `git log --oneline` in your terminal. You will see a list of short IDs and messages.
   *Example output:*
   `9ed8732 UI: Increase text contrast, add account active status toggle`
   `a1b2c3d Setup MeroShare API Backend`

2. **Revert the Entire Project:**
   If you want to permanently erase all uncommitted work and jump back to the most recent safe point:
   `git reset --hard HEAD`

3. **Revert to a Specific Checkpoint:**
   If you want to travel back to a *specific* checkpoint in history (for example, `9ed8732`), run:
   `git reset --hard 9ed8732`
   
**⚠️ WARNING**: `git reset --hard` will permanently delete any new code you wrote *after* that checkpoint if you haven't saved it. Only do this if you are absolutely sure you want to throw away your recent broken changes!
