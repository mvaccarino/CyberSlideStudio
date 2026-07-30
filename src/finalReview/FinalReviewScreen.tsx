import { useRef, useState } from "react";
import type { Project } from "../models/Project";

const bytes=(value:number)=>value>=1024*1024?`${(value/1024/1024).toFixed(1)} MB`:`${Math.max(0,value/1024).toFixed(0)} KB`;
const duration=(value:number)=>`${Math.floor(value/60)}:${String(Math.round(value%60)).padStart(2,"0")}`;

export function FinalReviewScreen({project,videoUrl,onPublish,onEdit,onOpenFolder,onExport}:{project:Project;videoUrl:string;onPublish:()=>void;onEdit:()=>void;onOpenFolder:()=>void;onExport:()=>void}) {
  const video=useRef<HTMLVideoElement>(null);const [position,setPosition]=useState(0);const render=project.finalRender!;
  return <div className="final-review-screen">
    <header><p className="eyebrow">PRODUCTION COMPLETE</p><h1>Final Review</h1><p>Your finished video is ready for review.</p></header>
    <section className="final-review-layout">
      <div className="final-video-panel">
        <video ref={video} src={videoUrl} onTimeUpdate={e=>setPosition(e.currentTarget.currentTime)} onEnded={()=>setPosition(render.durationSeconds)} />
        <input aria-label="Video timeline" type="range" min="0" max={render.durationSeconds||1} step=".05" value={position} onChange={e=>{const value=Number(e.target.value);setPosition(value);if(video.current)video.current.currentTime=value;}}/>
        <div className="video-controls"><button onClick={()=>void video.current?.play()}>Play</button><button onClick={()=>video.current?.pause()}>Pause</button><button onClick={()=>{if(video.current){video.current.currentTime=0;void video.current.play();}}}>Replay</button><span>{duration(position)} / {duration(render.durationSeconds)}</span></div>
      </div>
      <aside className="final-metadata">
        <h2>Production Details</h2>
        <dl><div><dt>Duration</dt><dd>{duration(render.durationSeconds)}</dd></div><div><dt>Resolution</dt><dd>{render.width} × {render.height}</dd></div><div><dt>File Size</dt><dd>{bytes(render.fileSizeBytes)}</dd></div><div><dt>Production Style</dt><dd>{project.productionStyle.name}</dd></div><div><dt>Music</dt><dd>{project.music.displayTitle||"Narration only"}</dd></div><div><dt>Voice</dt><dd>{project.voiceStyle}</dd></div><div><dt>Subtitles</dt><dd>{project.subtitles.enabled?"Enabled":"Disabled"}</dd></div><div><dt>Render Date</dt><dd>{new Date(render.renderedAt).toLocaleString()}</dd></div></dl>
        <button className="publish-primary" onClick={onPublish}>🚀 Publish</button>
        <div className="final-secondary-actions"><button onClick={()=>void video.current?.play()}>Preview Video</button><button onClick={onEdit}>Edit Project</button><button onClick={onOpenFolder}>Open Output Folder</button><button className="deemphasized" onClick={onExport}>Export Production Package</button></div>
      </aside>
    </section>
  </div>;
}
