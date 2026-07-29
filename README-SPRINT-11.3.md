# CyberSlide Studio — Sprint 11.3 Content Production Package

## Add
- `src/production/types.ts`
- `src/production/ProductionPackageBuilder.ts`
- `electron/productionPackageHandlers.cjs`

## Replace
- `src/App.tsx`
- `src/App.css`
- `src/components/CreativeDirector/CreativeDirectorPanel.tsx`
- `src/types/electron.d.ts`

## Electron integration
Use the two snippet files in the `electron` folder to add the handler registration
to your active `electron/main.cjs` and the bridge method to `electron/preload.cjs`.

## New feature
The Creative Director panel now includes **Export Production Package**.

It exports:
- Slides PNGs currently generated in the project
- CapCut editing blueprint TXT and PDF
- Timeline and timing JSON
- Full voiceover script
- Slide-by-slide voiceover
- ElevenLabs-ready script
- Music and SFX recommendations
- YouTube Shorts package
- Instagram Reels package
- TikTok package
- Production checklist
- Project summary PDF and JSON

## Verify
```powershell
cd C:\CyberSlideStudio
npm run lint
npm run build
npm run desktop
```
