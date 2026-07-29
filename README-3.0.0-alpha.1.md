# CyberSlide Studio 3.0.0-alpha.1 — Native Video Foundation

This is the first functional native-video subsystem.

## What it does

- Builds a video plan from finalized slide images
- Calculates automatic scene duration from slide text
- Applies four automatic motion presets
- Adds animated transitions between scenes
- Normalizes and adds one imported voiceover file
- Exports a 1080 × 1920, 30 FPS H.264 MP4
- Writes the result to:

```text
C:\CyberSlide Projects\<Project Name>\Video\
```

- Emits render-progress events to the React UI
- Supports render cancellation
- Opens the completed MP4 in Windows Explorer

## This alpha does not include yet

- Burned-in captions
- Word-by-word caption highlighting
- Background music rotation and ducking
- Sound effects
- Generated voiceover
- Live React preview

Those belong to the next Audio + Caption Engine milestone.

## Add

```text
C:\CyberSlideStudio\electron\video\ffmpegResolver.cjs
C:\CyberSlideStudio\electron\video\videoPlan.cjs
C:\CyberSlideStudio\electron\video\nativeVideoRenderer.cjs
C:\CyberSlideStudio\electron\video\registerVideoHandlers.cjs

C:\CyberSlideStudio\src\video\types.ts
C:\CyberSlideStudio\src\video\VideoPlanBuilder.ts
C:\CyberSlideStudio\src\video\NativeVideoService.ts
```

Use the included integration snippets for:

```text
electron\main.cjs
electron\preload.cjs
src\types\electron.d.ts
```

## FFmpeg

Place `ffmpeg.exe` at:

```text
C:\CyberSlideStudio\resources\ffmpeg\ffmpeg.exe
```

or install FFmpeg on PATH.

## Recommended first UI

Add a **Video** navigation item with:

- Select Voiceover
- Check Renderer
- Render Final MP4
- Progress bar
- Cancel Render

The backend renderer in this update is ready for that UI integration.
