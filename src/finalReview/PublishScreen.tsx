export function PublishScreen({onBack}:{onBack:()=>void}) {
  return <div className="publish-screen"><p className="eyebrow">PUBLISH</p><h1>Choose Your Destination</h1><p>Direct publishing arrives in Sprint 6.</p><div className="publish-destinations">{["YouTube","TikTok","Instagram"].map(name=><article key={name}><h2>{name}</h2><span>Coming in Sprint 6</span><button disabled>Publish</button></article>)}</div><button className="secondary-button" onClick={onBack}>Back to Final Review</button></div>;
}
