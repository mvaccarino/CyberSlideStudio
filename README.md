# CyberSlide Studio — Sprint 3 Task 1

This task adds native `.cslide` project files.

## Replace these files

- `electron/main.cjs`
- `electron/preload.cjs`
- `src/App.tsx`

## Add these files

- `src/services/ProjectFileService.ts`
- `src/types/electron.d.ts`

## Features

- Native **File → New Project**
- Native **File → Open Project**
- Native **File → Save**
- Native **File → Save As**
- Keyboard shortcuts:
  - Ctrl+N
  - Ctrl+O
  - Ctrl+S
  - Ctrl+Shift+S
- Open and Save buttons in the application header
- `.cslide` JSON serialization
- Project validation and normalization when opening files
- Existing project path tracking
- Saved/unsaved status
- Current file path display

## Install

Stop the application with `Ctrl+C`.

Copy the included files into the matching locations under:

```text
C:\CyberSlideStudio
```

Allow Windows to replace existing files.

## Verify

```powershell
cd C:\CyberSlideStudio
npm run lint
npm run build
npm run desktop
```

## Manual test

1. Select **File → Save As**.
2. Save the project as `Password-Managers.cslide`.
3. Change a slide title.
4. Confirm the app shows **Unsaved**.
5. Press `Ctrl+S`.
6. Confirm the app shows **Saved**.
7. Select **File → New Project**.
8. Select **File → Open Project**.
9. Reopen `Password-Managers.cslide`.
10. Confirm the script, slides, validation, and settings are restored.
