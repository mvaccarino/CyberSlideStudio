# CyberSlide Studio — Sprint 11.2

## Smart Headline Writer

This update fixes blank slide titles generating **UNTITLED MESSAGE**.

### Add

```text
C:\CyberSlideStudio\src\headlines\HeadlineGenerator.ts
```

### Replace

```text
C:\CyberSlideStudio\src\App.tsx
C:\CyberSlideStudio\src\App.css
C:\CyberSlideStudio\src\components\CreativeDirector\CreativeDirectorPanel.tsx
```

## Behavior

- A script title is used exactly when present.
- A blank title never becomes `UNTITLED MESSAGE`.
- CyberSlide derives up to eight concise headline choices from the body.
- The first option is selected automatically during batch generation.
- The Creative Director displays the alternatives for the selected slide.
- Selecting another option updates the prompt used for the next generation.
- Existing queue, ETA, pause, cancel, retry, highlight color, and Draft/Final workflow remain intact.

## Verify

```powershell
cd C:\CyberSlideStudio
npm run lint
npm run build
npm run desktop
```

Generate a script containing blank `Title:` fields. Every generated poster should now use a meaningful derived headline instead of placeholder text.
