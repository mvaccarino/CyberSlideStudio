# CyberSlide Studio Version 2.0.1 — Workspace & Queue Polish

## Replace

```text
C:\CyberSlideStudio\electron\main.cjs
C:\CyberSlideStudio\electron\preload.cjs
C:\CyberSlideStudio\electron\productionPackageHandlers.cjs

C:\CyberSlideStudio\src\App.tsx
C:\CyberSlideStudio\src\App.css
C:\CyberSlideStudio\src\services\PosterGenerationService.ts
C:\CyberSlideStudio\src\types\electron.d.ts
C:\CyberSlideStudio\src\queue\types.ts
C:\CyberSlideStudio\src\queue\queueMetrics.ts
C:\CyberSlideStudio\src\components\CreativeDirector\CreativeDirectorPanel.tsx
```

## Workspace behavior

CyberSlide Studio now uses:

```text
C:\CyberSlide Projects\<Project Name>\
```

For example:

```text
C:\CyberSlide Projects\Why Password Managers Matter\
├── Why Password Managers Matter.cslide
├── Draft
├── Final
├── Production Package
├── History
└── Cache
```

Draft generation saves to `Draft`.
High-quality generation saves to `Final`.
Production Package exports directly to `Production Package` and opens it in Explorer.

If a project is still named `Untitled Project`, the first non-empty slide title is
used as the effective project name.

## Queue fixes

- Draft queue completion shows `0s` remaining.
- Completion time is shown instead of `Calculating`.
- Total elapsed time is shown.
- Status changes from Current to Status.
- Every generation run resets the queue before starting.

## Verify

```powershell
cd C:\CyberSlideStudio
npm run lint
npm run build
npm run desktop
```

Fully stop and restart Electron because `main.cjs` and `preload.cjs` changed.
