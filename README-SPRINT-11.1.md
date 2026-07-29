# CyberSlide Studio — Sprint 11.1 Queue Foundation

This update builds the first batch-generation workflow for CyberSlide Studio 2.0.

## Install

Copy the included `src` folder over your existing project folder:

```text
C:\CyberSlideStudio\src
```

No Electron `main.cjs`, `preload.cjs`, or API service changes are required for this milestone.

Then run:

```powershell
cd C:\CyberSlideStudio
npm run lint
npm run build
npm run desktop
```

## Included

- Generate Current Slide in Draft quality (`low`)
- Generate All Slides sequentially in Draft quality
- Automatic recommendation creation for every queued slide
- Per-slide queue states: waiting, generating, complete, failed, cancelled
- Live project progress percentage
- Rolling average generation time
- Estimated time remaining
- Estimated clock completion time
- Pause and resume between API requests
- Cancel after the active API request finishes
- Continue after individual slide failures
- Retry Failed Slides
- High quality (`high`) used only by Final Export
- High-quality final poster generation replaces the selected draft before saving
- Existing highlight-color controls retained

## Queue behavior

OpenAI image requests cannot be interrupted safely after they have been submitted by this renderer-only milestone. Pause and Cancel therefore take effect immediately after the active poster request finishes. All remaining queued slides are then paused or cancelled.

## Recommended test

1. Save the `.cslide` project.
2. Confirm the OpenAI API key is connected.
3. Use a script containing at least three valid slides.
4. Click **Generate All Slides — Draft**.
5. Confirm each generated image appears when its slide is selected.
6. Pause and resume between slides.
7. Temporarily create an invalid slide or disconnect the API to confirm failure tracking and retry.
8. Select a completed draft and click **Final Export — High Quality**.
