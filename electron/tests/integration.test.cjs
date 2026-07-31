const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { migrateLegacyAssets } = require("../workspaceMigration.cjs");
const {
  categoryForText,
  chooseRotated,
  buildAudioPlan,
} = require("../music/musicDirector.cjs");
const { validatePlan, totalDuration } = require("../video/videoPlan.cjs");
test("legacy Draft/Final assets migrate without overwriting current assets", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "cyberslide-test-"));
  const w = {
    legacyDraft: path.join(root, "Draft"),
    legacyFinal: path.join(root, "Final"),
    working: path.join(root, "Working"),
    approved: path.join(root, "Approved"),
  };
  await Promise.all([
    fs.mkdir(w.legacyDraft),
    fs.mkdir(w.legacyFinal),
    fs.mkdir(w.working),
    fs.mkdir(w.approved),
  ]);
  await fs.writeFile(path.join(w.legacyDraft, "a.png"), "draft");
  await fs.writeFile(path.join(w.legacyFinal, "b.png"), "final");
  await fs.writeFile(path.join(w.approved, "b.png"), "approved");
  await migrateLegacyAssets(w);
  assert.equal(
    await fs.readFile(path.join(w.working, "a.png"), "utf8"),
    "draft",
  );
  assert.equal(
    await fs.readFile(path.join(w.approved, "b.png"), "utf8"),
    "approved",
  );
  await fs.rm(root, { recursive: true, force: true });
});
test("music category matching recognizes cyber threats", () =>
  assert.equal(
    categoryForText("Urgent ransomware breach and hacker attack"),
    "Dark Cyber",
  ));
test("rotation avoids recent tracks and falls back to the only track", () => {
  const tracks = [{ sourcePath: "a" }, { sourcePath: "b" }];
  assert.equal(chooseRotated(tracks, ["a"])[0].sourcePath, "b");
  assert.equal(chooseRotated([tracks[0]], ["a"])[0].sourcePath, "a");
});
test("video plan validates approved absolute paths and duration", () => {
  const plan = validatePlan({
    projectName: "Test",
    scenes: [
      {
        imagePath: path.resolve("approved.png"),
        durationSeconds: 5,
        transitionSeconds: 0.3,
      },
    ],
  });
  assert.equal(totalDuration(plan), 5);
  assert.throws(() => validatePlan({ scenes: [] }), /does not contain/);
});
test("audio plan clamps fade start and preserves ducking", () =>
  assert.deepEqual(
    buildAudioPlan({ fadeOutSeconds: 2, gain: 0.2, duckingEnabled: true }, 10),
    { durationSeconds: 10, fadeOutStart: 8, gain: 0.2, duckingEnabled: true },
  ));
const ts = require("typescript");
const Module = require("node:module");
require.extensions[".ts"] = function compileTypeScript(mod, filename) {
  const source = require("node:fs").readFileSync(filename, "utf8");
  mod._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
};
function loadTypeScript(relativePath) {
  const filename = path.resolve(__dirname, "..", "..", relativePath);
  const source = require("node:fs").readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = module.paths;
  loaded._compile(output, filename);
  return loaded.exports;
}
test("AI motion director avoids consecutive repeated movement", () => {
  const { directMotions } = loadTypeScript("src/aiDirector/MotionDirector.ts");
  const assets = [1, 2, 3, 4].map((n) => ({
    slideId: String(n),
    slideNumber: n,
    path: `${n}.png`,
    title: "Centered subject",
    body: "balanced visual",
  }));
  const result = directMotions(assets, "Cybersecurity Professional");
  for (let i = 1; i < result.length; i++)
    assert.notEqual(result[i].motion, result[i - 1].motion);
});
test("transition director limits consecutive repetition", () => {
  const { directTransitions } = loadTypeScript(
    "src/aiDirector/MotionDirector.ts",
  );
  const result = directTransitions(12, "Cybersecurity Professional");
  for (let i = 3; i < result.length; i++)
    assert.ok(
      !result.slice(i - 3, i + 1).every((value) => value === result[i]),
    );
});
test("pipeline advances completed stage and exposes one current stage", () => {
  const { advance, statusThrough } = loadTypeScript(
    "src/aiDirector/pipelineState.ts",
  );
  const status = advance(statusThrough(["script"], "images"), "images");
  assert.equal(status.script, "completed");
  assert.equal(status.images, "completed");
  assert.equal(status.voice, "current");
  assert.equal(
    Object.values(status).filter((value) => value === "current").length,
    1,
  );
});

test("content template schema accepts complete seeds and rejects incomplete templates", async () => {
  const { validateTemplate } = require("../library/libraryService.cjs");
  const { templateFor } = require("../library/seedLibrary.cjs");
  assert.deepEqual(
    validateTemplate(templateFor("Cybersecurity", "Test Topic", 0)),
    [],
  );
  assert.match(
    validateTemplate({ title: "Incomplete" }).join(" "),
    /id must be/,
  );
});
test("content library scan indexes valid JSON and reports invalid files", async () => {
  const {
    ensureLibrary,
    scanLibrary,
  } = require("../library/libraryService.cjs");
  const { templateFor } = require("../library/seedLibrary.cjs");
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "cyberslide-library-"));
  await ensureLibrary(root);
  await fs.writeFile(
    path.join(root, "AI", "valid.json"),
    JSON.stringify(templateFor("AI", "Test AI", 1)),
  );
  await fs.writeFile(path.join(root, "Privacy", "invalid.json"), "{");
  const result = await scanLibrary(root);
  assert.equal(result.templates.length, 1);
  assert.equal(result.errors.length, 1);
  await fs.rm(root, { recursive: true, force: true });
});
test("content search covers scripts, prompts, slides, and filters", () => {
  const { searchTemplates } = loadTypeScript("src/library/TemplateSearch.ts");
  const { templateFor } = require("../library/seedLibrary.cjs");
  const ai = templateFor("AI", "Model Safety", 1);
  const cyber = templateFor("Cybersecurity", "Ransomware", 2);
  assert.deepEqual(
    searchTemplates([ai, cyber], "ransomware").map((item) => item.id),
    [cyber.id],
  );
  assert.deepEqual(
    searchTemplates([ai, cyber], "cinematic lighting").length,
    2,
  );
  assert.deepEqual(
    searchTemplates([ai, cyber], "", {
      category: "Artificial Intelligence",
    }).map((item) => item.id),
    [ai.id],
  );
});
test("content favorites and recent use persist locally", async () => {
  const {
    toggleFavorite,
    recordUsed,
    readActivity,
  } = require("../library/libraryService.cjs");
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "cyberslide-activity-"));
  const file = path.join(root, "activity.json");
  await toggleFavorite(file, "template-a");
  await recordUsed(file, "template-b");
  const state = await readActivity(file);
  assert.deepEqual(state.favorites, ["template-a"]);
  assert.equal(state.recentlyUsed[0].id, "template-b");
  await fs.rm(root, { recursive: true, force: true });
});
const captions = require("../captions/captionEngine.cjs");
const captionScenes = [
  {
    slideNumber: 1,
    text: "Stop now. Verify every unexpected request before you respond.",
    sceneStartSeconds: 2,
    sceneEndSeconds: 8,
    paddingBeforeSeconds: 0.2,
    paddingAfterSeconds: 0.3,
  },
];
const editorialCjs=require("../captions/editorialEngine.cjs");
const editorialDirector=loadTypeScript("src/editorial/EditorialDirector.ts");
const layoutDirector=loadTypeScript("src/editorial/EditorialLayoutDirector.ts");
const editorialSlides=[{number:1,title:"Your Antivirus Isn't Enough",body:"One infected laptop can expose files, passwords, and the rest of your business network.",cta:"",editorial:{displayHeadline:"YOUR ANTIVIRUS ISN'T ENOUGH",emphasizedText:"ISN'T ENOUGH",supportingLine:"Endpoint protection watches every work device for suspicious behavior.",layoutAlignment:"left",posterTextRegion:"upper-left",manualOverride:false,validationWarnings:[]}}];
test("editorial layout is generated for every slide with exactly one in-headline emphasis",()=>{const slides=[{id:"1",number:1,title:"Your Antivirus Isn't Enough",body:"One infected laptop can expose the network.",cta:"",editorial:null},{id:"2",number:2,title:"Protect Every Device",body:"Install endpoint protection on every work computer.",cta:"",editorial:null}];const result=editorialDirector.generateEditorialLayouts(slides,[],"Follow for more tips.");assert.equal(result.length,2);for(const slide of result){assert.ok(slide.editorial);assert.ok(slide.editorial.displayHeadline.replace(/\n/g," ").includes(slide.editorial.emphasizedText));assert.ok(slide.editorial.emphasizedText.split(/\s+/).length<=3);}});
test("headline and support are distinct and the full body is never rendered",()=>{const ass=captions.buildOverlayAss(editorialSlides,captionScenes,{...captions.DEFAULT_OVERLAY,enabled:true,posterStyle:"CyberSlide Bold",posterTextMode:"persistent"});assert.match(ass,/Style: Editorial/);assert.match(ass,/Style: Support/);assert.match(ass,/\\pos\(70,150\)/);assert.doesNotMatch(ass,/One infected laptop can expose files, passwords, and the rest of your business network/);assert.deepEqual(editorialDirector.validateEditorial(editorialSlides[0].editorial,editorialSlides[0].body),[]);});
test("captions source narration only and start when narration begins",()=>{const events=captions.buildCaptionEvents(captionScenes,4);assert.ok(events.every(event=>event.source==="narration"));assert.equal(events[0].startSeconds,captionScenes[0].sceneStartSeconds+captionScenes[0].paddingBeforeSeconds);assert.equal(events.map(event=>event.text).join(" "),captionScenes[0].text);});
test("caption grouping remains three to six words and two lines",()=>{const events=captions.buildCaptionEvents(captionScenes,5);assert.ok(events.every(event=>event.words.length>=3&&event.words.length<=6));assert.ok(events.every(event=>event.lines.split("\\N").length<=2));});
test("final editorial slide supports the selected Brand CTA",()=>{const slides=[{id:"1",number:1,title:"Stop the Attack",body:"Catch suspicious behavior before it spreads.",cta:"Brand CTA",editorial:null}];const result=editorialDirector.generateEditorialLayouts(slides,[],"Click the Follow button to see new cybersecurity tips every day.");assert.equal(result[0].editorial.supportingLine,result[0].editorialPackage.supportLine);});
test("image-aware layout selects the opposite side and centered fallback",()=>{
  assert.equal(layoutDirector.decideEditorialLayout({analysis:{subjectPosition:"right",visualWeight:"balanced"}}).alignment,"left");
  assert.equal(layoutDirector.decideEditorialLayout({analysis:{subjectPosition:"left",visualWeight:"balanced"}}).alignment,"right");
  assert.equal(layoutDirector.decideEditorialLayout({analysis:{subjectPosition:"center",visualWeight:"balanced"}}).alignment,"left");
  assert.equal(layoutDirector.decideEditorialLayout({analysis:{subjectPosition:"center",visualWeight:"balanced",negativeSpaceRegion:"right"}}).alignment,"right");
});
test("crowded and focal-object scenarios produce avoidance warnings",()=>{
  const crowded=layoutDirector.decideEditorialLayout({analysis:{subjectPosition:"center",visualWeight:"heavy",negativeSpaceRegion:"none",focalObjectPosition:"high",subjectExtendsIntoCaptionZone:true}});
  assert.ok(crowded.layoutConfidence<.55); assert.ok(crowded.layoutWarnings.length>=3); assert.ok(crowded.textRegionBounds.y+crowded.textRegionBounds.height<crowded.safeCaptionBounds.y);
});
test("manual overrides persist explicit left right and top choices",()=>{
  assert.equal(layoutDirector.decideEditorialLayout({override:"text-right",analysis:{subjectPosition:"right",visualWeight:"balanced"}}).alignment,"right");
  assert.equal(layoutDirector.decideEditorialLayout({override:"top-left"}).alignment,"left");
});
test("balanced headline wrapping responds to width without orphans",()=>{
  const wide=layoutDirector.balancedHeadlineWrap("YOUR ANTIVIRUS ISN'T ENOUGH",390,108,5),narrow=layoutDirector.balancedHeadlineWrap("YOUR ANTIVIRUS ISN'T ENOUGH",300,108,5);
  assert.ok(narrow.length>=wide.length); assert.ok(narrow.every(line=>line.trim()&&!/^[\\/.,:;!?-]+$/.test(line)));
});
test("frame scenarios keep objects opposite editorial text",()=>{
  const scenarios=[
    [{subjectPosition:"right",visualWeight:"balanced"},"left"],
    [{subjectPosition:"left",visualWeight:"balanced"},"right"],
    [{subjectPosition:"center",visualWeight:"balanced"},"left"],
    [{subjectPosition:"center",visualWeight:"balanced",focalObjectBounds:{x:700,y:500,width:260,height:220}},"left"],
    [{subjectPosition:"center",visualWeight:"balanced",focalObjectBounds:{x:80,y:520,width:220,height:300}},"right"],
    [{subjectPosition:"center",visualWeight:"heavy",negativeSpaceRegion:"none"},"left"],
    [{subjectPosition:"center",visualWeight:"light",negativeSpaceRegion:"left"},"left"],
    [{subjectPosition:"center",visualWeight:"balanced",faceBounds:[{x:650,y:200,width:160,height:180},{x:820,y:210,width:140,height:170}]},"left"],
    [undefined,"left"],
  ];
  for(const [analysis,expected] of scenarios) assert.equal(layoutDirector.decideEditorialLayout({analysis}).alignment,expected);
});
test("editorial and caption bounds never overlap and support follows headline",()=>{
  const decision=layoutDirector.decideEditorialLayout({captionSafePercent:25,analysis:{subjectPosition:"right",visualWeight:"balanced"}});
  assert.ok(decision.textRegionBounds.y+decision.textRegionBounds.height<decision.safeCaptionBounds.y);
  assert.ok(decision.supportAnchorPoint.y>decision.headlineAnchorPoint.y);
  assert.ok(decision.subjectRegionBounds.x>=decision.textRegionBounds.x+decision.textRegionBounds.width);
});
test("Editorial Bold is category-independent and legacy style remains renderable",()=>{
  assert.equal(editorialDirector.STYLE_TO_EDITORIAL["Cybersecurity Professional"],"Editorial Bold");
  assert.ok(editorialDirector.EDITORIAL_PRESETS["Editorial Bold"]);
  assert.ok(editorialCjs.PRESETS["CyberSlide Bold"]);
});test("captions remain safely centered without bottom clipping",()=>{
  const y25=captions.captionY(25,"safe-center",54),large=captions.captionY(25,"safe-center",84);
  assert.ok(y25>=1580&&y25<=1660); assert.ok(large+Math.ceil(84*1.35)<=1740);
  for(const safe of [20,25,30]){const y=captions.captionY(safe,"safe-center",54),top=1920*(1-safe/100);assert.ok(y>top);assert.ok(y+73<=1740);}
  const ass=captions.buildSubtitleAss(captions.buildCaptionEvents(captionScenes,5),{...captions.DEFAULT_SUBTITLES,safeAreaPercent:25,fontSize:54});
  assert.match(ass,new RegExp(`\\\\pos\\(540,${y25}\\)`)); assert.match(ass,/\\k\d+/);
});test("one and two line captions keep active-word highlighting inside safe bounds",()=>{
 const one=[{slideNumber:1,startSeconds:0,endSeconds:1,text:"Stay alert",lines:"Stay alert",words:["Stay","alert"],source:"narration"}],two=[{slideNumber:1,startSeconds:0,endSeconds:2,text:"Verify every unexpected request now",lines:"Verify every unexpected\\Nrequest now",words:["Verify","every","unexpected","request","now"],source:"narration"}];
 const oneAss=captions.buildSubtitleAss(one,{...captions.DEFAULT_SUBTITLES,safeAreaPercent:25}),twoAss=captions.buildSubtitleAss(two,{...captions.DEFAULT_SUBTITLES,safeAreaPercent:25,fontSize:84});
 assert.doesNotMatch(oneAss,/unexpected\\N/); assert.match(twoAss,/unexpected\\N/); assert.match(twoAss,/\\k\d+/); assert.ok(captions.captionY(25,"safe-center",84)+Math.ceil(84*1.35)<=1740);
});test("persistent and brief editorial poster timing are supported",()=>{const persistent=editorialCjs.buildEditorialAss(editorialSlides,captionScenes,{enabled:true,posterTextMode:"persistent"}),brief=editorialCjs.buildEditorialAss(editorialSlides,captionScenes,{enabled:true,posterTextMode:"brief",duration:1.8});assert.match(persistent,/0:00:02\.00,0:00:08\.00,Editorial/);assert.match(brief,/0:00:02\.00,0:00:03\.80,Editorial/);assert.match(brief,/\\fad\(160,320\)/);});
test("editorial ASS renders emphasized whole tokens as separate heavy events",()=>{
 const ass=editorialCjs.buildEditorialAss(editorialSlides,captionScenes,{enabled:true,posterStyle:"Editorial Bold",highlightColor:"#20D7FF"});
 assert.match(ass,/Style: Editorial,Impact,138/); assert.match(ass,/Dialogue: 2[^\n]*ISN'T/); assert.match(ass,/Dialogue: 2[^\n]*ENOUGH/); assert.doesNotMatch(ass,/Dialogue: 2[^\n]*,IS$/m); assert.match(ass,/Style: Support,Arial,44/);
});
test("whole-token emphasis handles apostrophes and multi-word phrases",()=>{
 for(const phrase of ["ISN'T","CAN'T","DON'T","PHONE NUMBER","NOT ENOUGH","READ YOUR DATA"]) assert.deepEqual(editorialCjs.phraseRange((`BEFORE ${phrase} AFTER`).split(/\s+/),phrase),{start:1,end:1+phrase.split(/\s+/).length});
 assert.deepEqual(editorialCjs.phraseRange(["ISN’T","ENOUGH"],"ISN'T ENOUGH"),{start:0,end:2});
 assert.equal(editorialCjs.phraseRange(["THIS","ISLAND"],"IS"),null);
 const across=editorialCjs.lineSegments([{text:"ISN'T"},{text:"ENOUGH"}],"ISN'T ENOUGH","ISN'T ENOUGH"); assert.ok(across.every(line=>line.segments.every(segment=>segment.emphasized)));
});
test("headline simplifier removes filler lines and prefers two to four strong lines",()=>{
 const headline=editorialDirector.simplifyDisplayHeadline("Endpoint Protection in Plain English"); assert.equal(headline,"ENDPOINT PROTECTION PLAIN ENGLISH");
 const lines=layoutDirector.designHeadlineStack(headline,"PLAIN ENGLISH",348,138,"Editorial Rag",[]); assert.ok(lines.length>=2&&lines.length<=4); assert.ok(lines.every(line=>!/^(IN|A|THE|TO)$/i.test(line.text)));
});
test("refined Editorial Bold uses a narrow region larger support and soft gradient",()=>{
 const decision=layoutDirector.decideEditorialLayout({analysis:{subjectPosition:"right",visualWeight:"balanced"}}); assert.ok(decision.textRegionBounds.width>=324&&decision.textRegionBounds.width<=367);
 assert.ok(editorialCjs.PRESETS["Editorial Bold"].supportSize>=34&&editorialCjs.PRESETS["Editorial Bold"].supportSize<=44);
 const ass=editorialCjs.buildEditorialAss(editorialSlides,captionScenes,{enabled:true,posterStyle:"Editorial Bold"}); assert.ok((ass.match(/,Gradient,/g)||[]).length>=6); const support=ass.split("\n").find(line=>line.includes(",Support,")); assert.ok((support.match(/\\N/g)||[]).length<=3);
});test("Editorial Rag fixtures use heavy minimum sizes and designed offsets",()=>{
 assert.equal(editorialCjs.selectHeavyFont(["Impact","Arial"]),"Impact"); assert.ok(editorialCjs.PRESETS["Editorial Bold"].minSize>=112);
 for(const fixture of [["YOUR ANTIVIRUS ISN'T ENOUGH","ISN'T ENOUGH"],["YOUR PHONE NUMBER CAN BE STOLEN","PHONE NUMBER"],["THAT EXTENSION CAN READ YOUR DATA","READ YOUR DATA"],["ONE CLICK CAN SPREAD RANSOMWARE","ONE CLICK"]]){
   const lines=layoutDirector.designHeadlineStack(fixture[0],fixture[1],390,146,"Editorial Rag",[]); assert.ok(lines.every(line=>line.fontSize>=112)); assert.ok(new Set(lines.map(line=>line.xOffset)).size>1); assert.ok(lines.some(line=>line.emphasized));
 }
});
test("migration defaults to category-independent Editorial Bold persistent auto layout",()=>{const migrated=loadTypeScript("src/captions/migration.ts").migrateTextRenderingSettings({enabled:false,headlineMode:"off"},{enabled:false},{...captions.DEFAULT_OVERLAY},{...captions.DEFAULT_SUBTITLES},25,true);assert.equal(migrated.overlay.enabled,true);assert.equal(migrated.overlay.posterStyle,"Editorial Bold");assert.equal(migrated.overlay.posterTextMode,"persistent");assert.equal(migrated.overlay.alignment,"auto");assert.equal(migrated.subtitles.safeAreaPercent,25);});
test("ASS filter escaping handles Windows punctuation",()=>assert.equal(captions.escapeAssFilterPath("C:\\CyberSlide Projects\\O'Brien, Demo\\captions.ass"),"C\\:/CyberSlide Projects/O\\'Brien\\, Demo/captions.ass"));
test("editorial freshness changes for title body style and layout but ignores unrelated music",()=>{const base={...captions.DEFAULT_OVERLAY,posterStyle:"CyberSlide Bold"},one=captions.overlayFreshness(editorialSlides,captionScenes,base),body=captions.overlayFreshness([{...editorialSlides[0],body:"Changed",editorial:{...editorialSlides[0].editorial,supportingLine:"A different specific support line."}}],captionScenes,base),style=captions.overlayFreshness(editorialSlides,captionScenes,{...base,posterStyle:"Documentary"}),same=captions.overlayFreshness(editorialSlides,captionScenes,{...base,musicStyle:"changed"});assert.notEqual(one,body);assert.notEqual(one,style);assert.equal(one,same);});const viral = require("../library/viralSeedDirector.cjs");
test("all 100 templates produce valid editorial text for every slide", () => {
  let index = 0, count = 0;
  for (const [group, topics] of Object.entries(viral.GROUPS)) for (const topic of topics) {
    const template = viral.templateFor(group, topic, index++);
    const slides = template.slides.map((slide, slideIndex) => ({...slide, id:`${template.id}-${slideIndex}`, number:slideIndex + 1, editorial:null}));
    const layouts = editorialDirector.generateEditorialLayouts(slides, [], "Click the Follow button to see new cybersecurity tips every day.");
    assert.equal(layouts.length, slides.length, topic);
    for (const [slideIndex, slide] of layouts.entries()) {
      assert.ok(slide.editorial, `${topic} slide ${slideIndex + 1}`);
      assert.deepEqual(editorialDirector.validateEditorial(slide.editorial, slide.body), [], `${topic} slide ${slideIndex + 1}: ${JSON.stringify(slide.editorial)}`);
    }
    count += 1;
  }
  assert.equal(count, 100);
});
test("viral quality scoring clears required thresholds", () => {
  const t = viral.templateFor("Cybersecurity", "Endpoint Protection", 21);
  const q = viral.scoreTemplate(t);
  assert.ok(q.score >= 85);
  assert.ok(q.dimensions.hookStrength >= 80);
  assert.ok(q.dimensions.beginnerClarity >= 90);
  assert.ok(q.dimensions.topicSpecificity >= 90);
  assert.ok(q.dimensions.practicalUsefulness >= 85);
});
test("viral director rejects every forbidden phrase", () => {
  const t = viral.templateFor("Cybersecurity", "Endpoint Protection", 21);
  t.voiceScript += " affects everyday decisions";
  assert.match(viral.scoreTemplate(t).errors.join(" "), /Forbidden/);
});
test("viral director rejects generic consultant scripts", () => {
  const t = viral.templateFor("Cybersecurity", "Endpoint Protection", 21);
  t.voiceScript =
    "Endpoint Protection can feel complicated. The right first steps make it manageable. ".repeat(
      12,
    );
  assert.match(viral.scoreTemplate(t).errors.join(" "), /Generic script/);
});
test("seed audit detects duplicate hooks", () => {
  const a = viral.templateFor("Cybersecurity", "Endpoint Protection", 21),
    b = viral.templateFor("Cybersecurity", "SIM Swapping", 42);
  b.hook = a.hook;
  assert.match(viral.auditTemplates([a, b]).errors.join(" "), /Duplicate hook/);
});
test("content similarity detects near-identical scripts", () => {
  const a =
    "A stolen password opens an email account. Use a unique password and turn on authentication.";
  assert.ok(viral.similarity(a, a + " Now check it.") > 0.7);
});
test("every seed explains its topic by name", () => {
  let i = 0;
  for (const [group, topics] of Object.entries(viral.GROUPS))
    for (const topic of topics) {
      const t = viral.templateFor(group, topic, i++);
      assert.ok(
        t.voiceScript.toLowerCase().includes(topic.toLowerCase()),
        topic,
      );
    }
});
test("every seed meets voice length and slide readability rules", () => {
  let i = 0;
  for (const [group, topics] of Object.entries(viral.GROUPS))
    for (const topic of topics) {
      const t = viral.templateFor(group, topic, i++);
      const words = t.voiceScript.split(/\s+/).length;
      assert.ok(words >= 78 && words <= 140, `${topic}: ${words}`);
      assert.ok(
        t.slides.every((slide) => slide.body.split(/\s+/).length <= 32),
        topic,
      );
    }
});
test("brand CTA appends exactly once and can replace a template CTA", () => {
  const brand = loadTypeScript("src/brand/BrandCTAEngine.ts");
  const custom = "Save this for later.";
  const first = brand.appendCTA(
    "A useful script. " + custom,
    brand.DEFAULT_BRAND_CTA,
    custom,
  );
  assert.ok(first.endsWith(brand.DEFAULT_BRAND_CTA));
  assert.equal(brand.appendCTA(first, brand.DEFAULT_BRAND_CTA), first);
});
test("all seeded templates end their final slide and narration with the default brand CTA", async () => {
  const brand = loadTypeScript("src/brand/BrandCTAEngine.ts");
  const root = path.resolve(__dirname, "..", "..", "ContentLibrary");
  const files = [];
  for (const folder of await fs.readdir(root, { withFileTypes: true }))
    if (folder.isDirectory())
      for (const name of await fs.readdir(path.join(root, folder.name)))
        if (name.endsWith(".json"))
          files.push(path.join(root, folder.name, name));
  assert.equal(files.length, 100);
  for (const file of files) {
    const template = JSON.parse(await fs.readFile(file, "utf8"));
    assert.equal(
      template.slides.at(-1).cta,
      brand.DEFAULT_BRAND_CTA,
      template.title,
    );
    assert.ok(
      template.voiceScript.endsWith(brand.DEFAULT_BRAND_CTA),
      template.title,
    );
  }
});

test("composition director injects the permanent protected-region prompt idempotently", () => {
  const composition = require("../composition/compositionDirector.cjs");
  const once = composition.composePosterPrompt("A specific office scene", 25);
  const twice = composition.composePosterPrompt(once, 30);
  assert.match(
    twice,
    /Compose the primary subject on the right side of the vertical frame when practical/,
  );
  assert.match(
    twice,
    /Reserve the left 38[–-]45% as clean dark editorial negative space/,
  );
  assert.equal((twice.match(/Compose the primary subject on the right side of the vertical frame when practical/g) || []).length, 1);
  assert.match(twice, /bottom 30%/);
});
test("composition director accepts only supported safe-area settings", () => {
  const composition = require("../composition/compositionDirector.cjs");
  assert.equal(composition.normalizeSafeArea(20), 20);
  assert.equal(composition.normalizeSafeArea(25), 25);
  assert.equal(composition.normalizeSafeArea(30), 30);
  assert.equal(composition.normalizeSafeArea(27), 25);
});

test("slide hierarchy rejects exact title and body duplication", () =>
  assert.match(
    viral
      .validateSlidePair({
        title: "Protect Your Account",
        body: "Protect Your Account",
        cta: "",
      })
      .join(" "),
    /duplicate/i,
  ));
test("slide hierarchy rejects punctuation-only duplication", () =>
  assert.match(
    viral
      .validateSlidePair({
        title: "Protect Your Account!",
        body: "Protect your account.",
        cta: "",
      })
      .join(" "),
    /duplicate/i,
  ));
test("slide hierarchy rejects capitalization-only duplication", () =>
  assert.match(
    viral
      .validateSlidePair({
        title: "PROTECT YOUR ACCOUNT",
        body: "protect your account",
        cta: "",
      })
      .join(" "),
    /duplicate/i,
  ));
test("slide hierarchy rejects near-duplicate title and body", () =>
  assert.match(
    viral
      .validateSlidePair({
        title: "Your Password Is At Risk",
        body: "Your password is at serious risk",
        cta: "",
      })
      .join(" "),
    /near duplicate|appends/i,
  ));
test("slide hierarchy rejects titles over ten words", () =>
  assert.match(
    viral
      .validateSlidePair({
        title:
          "This title contains far too many words for a strong vertical video headline",
        body: "A concise body adds specific information for the viewer.",
        cta: "",
      })
      .join(" "),
    /too long/i,
  ));
test("slide body must add substantive information", () =>
  assert.match(
    viral
      .validateSlidePair({
        title: "Password Warning",
        body: "Be careful now",
        cta: "",
      })
      .join(" "),
    /add information/i,
  ));
test("slide hierarchy accepts a distinct informative pair", () =>
  assert.deepEqual(
    viral.validateSlidePair({
      title: "Your Antivirus Isn't Enough",
      body: "One infected laptop can expose files, passwords, and the rest of your business network.",
      cta: "",
    }),
    [],
  ));
test("all 100 seed templates pass slide hierarchy validation", () => {
  let count = 0,
    index = 0;
  for (const [group, topics] of Object.entries(viral.GROUPS))
    for (const topic of topics) {
      const template = viral.templateFor(group, topic, index++);
      for (const [slideIndex, slide] of template.slides.entries())
        assert.deepEqual(
          viral.validateSlidePair(slide),
          [],
          `${topic} slide ${slideIndex + 1}`,
        );
      count += 1;
    }
  assert.equal(count, 100);
});

test("reference-inspired geometry protects support copy from the subject",()=>{
  const d=layoutDirector.decideEditorialLayout({analysis:{subjectPosition:"right",visualWeight:"balanced",focalObjectBounds:{x:610,y:260,width:330,height:680}}});
  assert.equal(layoutDirector.boundsOverlap(d.supportBounds,d.subjectRegionBounds),false);
  assert.ok(d.supportBounds.x>=d.textRegionBounds.x);
  assert.ok(d.supportBounds.x+d.supportBounds.width<=d.textRegionBounds.x+d.textRegionBounds.width);
  assert.ok(d.subjectRegionBounds.x-(d.textRegionBounds.x+d.textRegionBounds.width)>=d.subjectSafeGutter);
});

test("Editorial Rag uses compact intentional offsets without unexplained gaps",()=>{
  const lines=layoutDirector.designHeadlineStack("YOUR PHONE NUMBER CAN BE STOLEN","PHONE NUMBER",336,146,"Editorial Rag",[]);
  assert.ok(lines.length>=2&&lines.length<=4);
  assert.ok(lines.every(line=>Math.abs(line.xOffset)<=8));
  assert.ok(lines.some(line=>line.emphasized));
  assert.ok(lines.find(line=>line.emphasized).text.includes("PHONE NUMBER"));
});

test("support copy wraps early inside the compact editorial measure",()=>{
  const d=layoutDirector.decideEditorialLayout({analysis:{subjectPosition:"right",visualWeight:"balanced"}});
  const wrapped=editorialCjs.balancedWrap("Software watches every work device for suspicious behavior",d.maximumSupportWidth,44,4).split("\\N");
  assert.ok(d.maximumSupportWidth<d.maximumHeadlineWidth);
  assert.ok(wrapped.length>=2);
  assert.ok(wrapped.length<=4);
});

test("crowded preferred side falls back safely and records a warning",()=>{
  const d=layoutDirector.decideEditorialLayout({analysis:{subjectPosition:"center",visualWeight:"heavy",negativeSpaceRegion:"none",faceBounds:[{x:350,y:180,width:380,height:500}]}});
  assert.ok(d.layoutConfidence<.55);
  assert.ok(d.layoutWarnings.some(warning=>/No clear text region/i.test(warning)));
  assert.equal(layoutDirector.boundsOverlap(d.supportBounds,d.subjectRegionBounds),false);
});

const layoutTemplates=loadTypeScript("src/editorial/LayoutTemplates.ts");
const compositionPlans=loadTypeScript("src/editorial/CompositionPlan.ts");
const promptEngine=loadTypeScript("src/ai/PromptEngine.ts");
const compositionDirector=loadTypeScript("src/composition/CompositionDirector.ts");
const posterGeneration=loadTypeScript("src/services/PosterGenerationService.ts");

test("layout is selected before image prompt creation and remains category-independent",()=>{
  for(const category of ["Cybersecurity","AI","SmallBusiness","Privacy","FamilySafety","ITManagement"]){
    const slide={title:`${category} practical topic`,body:"A concrete real-world consequence and safer action.",captionSafeZonePercent:25};
    const plan=compositionPlans.createCompositionPlan(slide);
    assert.equal(plan.layoutTemplateId,"editorial-left");
    const prompt=promptEngine.buildPosterPromptV2({headline:slide.title,supportingText:slide.body,focalWords:[category],styleId:"editorial-tech",platform:"short-form-vertical",audience:"general-public",theme:category,layoutHint:"Editorial Left",conceptIndex:0,highlightColor:"#20D7FF",compositionInstruction:compositionPlans.compositionPrompt(plan)}).prompt;
    assert.match(prompt,/Reserve the left 38[–-]45%/);
    assert.match(prompt,/primary person, object, and action mainly on the right/i);
    assert.match(prompt,/lower caption zone/i);
    assert.match(prompt,/Do not generate written words/i);
    assert.doesNotMatch(prompt,/EXACT ON-IMAGE TEXT|reproduce exactly|Integrate the artwork, headline/i);
  }
});

test("Editorial Left geometry matches the approved reference ratios",()=>{
  const t=layoutTemplates.getLayoutTemplate("editorial-left");
  assert.deepEqual(t.textZone,{x:40,y:90,width:400,height:1110});
  assert.equal(t.subjectZone.x,500);
  assert.equal(t.captionZone.y,1440);
  assert.ok(t.subjectSafeGutter>=40&&t.subjectSafeGutter<=70);
  assert.ok(t.lineSpacing<0);
  assert.ok(t.supportWidth<t.headlineWidth);
  assert.deepEqual(t.fallbackLayoutIds.slice(0,2),["editorial-right","documentary-center"]);
});

test("deterministic renderer uses saved plan geometry and tight whole-phrase typography",()=>{
  const plan=compositionPlans.createCompositionPlan({title:"Your Antivirus Isn't Enough",body:"A single infected laptop can expose files.",captionSafeZonePercent:25});
  const decision=layoutDirector.decisionFromCompositionPlan(plan);
  const lines=layoutDirector.designHeadlineStack("YOUR ANTIVIRUS ISN'T ENOUGH","ISN'T ENOUGH",decision.maximumHeadlineWidth,160,"Block Stack",[]);
  assert.ok(lines.every(line=>line.xOffset===0));
  assert.ok(lines.some(line=>line.emphasized&&line.text==="ISN'T ENOUGH"));
  const slide={number:1,title:"Your Antivirus Isn't Enough",body:"A single infected laptop can expose files.",editorial:{displayHeadline:"YOUR ANTIVIRUS ISN'T ENOUGH",emphasizedText:"ISN'T ENOUGH",supportingLine:"One infected laptop can expose files.",layoutAlignment:"left",headlineWidth:400,headlineSize:160,headlineFont:"Impact",lineSpacing:-8,lineOffsets:[],headlineLines:lines,supportWidth:278,textVerticalPosition:90,highlightColor:"#20D7FF",decision}};
  const ass=editorialCjs.buildEditorialAss([slide],[{slideNumber:1,sceneStartSeconds:0,sceneEndSeconds:6}],{enabled:true,posterStyle:"Editorial Bold"});
  assert.match(ass,/\\pos\(40,90\)/);
  assert.match(ass,/Dialogue: 2[^\n]*ISN'T ENOUGH/);
  assert.doesNotMatch(ass,/\\\\\\\\N/);
});

test("support geometry is contained inside text zone and captions remain separate",()=>{
  const plan=compositionPlans.createCompositionPlan({title:"SIM Swapping",body:"A criminal moves your phone number to another device.",captionSafeZonePercent:25});
  const d=layoutDirector.decisionFromCompositionPlan(plan);
  assert.ok(d.supportBounds.x>=d.textRegionBounds.x);
  assert.ok(d.supportBounds.x+d.supportBounds.width<=d.textRegionBounds.x+d.textRegionBounds.width);
  assert.ok(d.textRegionBounds.y+d.textRegionBounds.height<=d.safeCaptionBounds.y);
  assert.equal(d.safeCaptionBounds.y,1440);
  assert.equal(d.safeCaptionBounds.y+d.safeCaptionBounds.height,1740);
});

test("subject and caption validation use saved-zone thresholds",()=>{
  assert.equal(compositionDirector.validateCompositionMeasurements(.82,.58,1.8).accepted,true);
  assert.equal(compositionDirector.validateCompositionMeasurements(1.3,.58,1.8).captionZoneSafe,false);
  assert.equal(compositionDirector.validateCompositionMeasurements(.82,1.05,1.8).editorialZoneSafe,false);
  assert.equal(compositionDirector.validateCompositionMeasurements(.82,.58,.7).subjectInsideZone,false);
});

test("composition regeneration is limited to one strengthened retry",()=>{
  assert.equal(posterGeneration.MAX_COMPOSITION_ATTEMPTS,2);
  assert.equal(posterGeneration.shouldRegenerateComposition(1,false),true);
  assert.equal(posterGeneration.shouldRegenerateComposition(2,false),false);
  assert.equal(posterGeneration.shouldRegenerateComposition(1,true),false);
});

test("legacy migration creates a plan without replacing approved images",()=>{
  const service=loadTypeScript("src/services/ProjectFileService.ts"), approved="C:\\CyberSlide Projects\\Legacy\\Approved\\slide-01.png";
  const migrated=service.deserializeProject(JSON.stringify({name:"Legacy",slides:[{id:"one",number:1,title:"Endpoint Protection",body:"Software watches devices for malicious behavior.",captionSafeZonePercent:25,background:{approvedImagePath:approved,approvalLocked:true}}]}));
  assert.equal(migrated.slides[0].background.approvedImagePath,approved);
  assert.equal(migrated.slides[0].layoutTemplateId,"editorial-left");
  assert.equal(migrated.slides[0].compositionPlan.layoutTemplateId,"editorial-left");
  assert.match(migrated.slides[0].layoutWarnings.join(" "),/predates layout-first/i);
});

test("all 100 seeded templates produce valid CompositionPlans",()=>{
  let index=0,count=0;
  for(const [group,topics] of Object.entries(viral.GROUPS))for(const topic of topics){
    const item=viral.templateFor(group,topic,index++);
    for(const slide of item.slides){
      const plan=compositionPlans.createCompositionPlan({title:slide.title,body:slide.body,captionSafeZonePercent:25});
      assert.equal(plan.layoutTemplateId,"editorial-left",`${topic}: ${slide.title}`);
      assert.ok(plan.textZone.width>0&&plan.subjectZone.width>0&&plan.captionZone.height>0);
      assert.ok(plan.prohibitedObjectZones.length>=2);
      assert.match(compositionPlans.compositionPrompt(plan),/Do not generate any written headline/);
    }
    count+=1;
  }
  assert.equal(count,100);
});

test("visual composition fixtures select deterministic subject zones",()=>{
  const fixtures=[["person on right","editorial-left","right"],["person on left","editorial-right","left"],["laptop focal object","editorial-left","right"],["phone focal object","editorial-left","right"],["multiple people","editorial-left","right"],["no person","minimal","right"],["centered object fallback","documentary-center","center"]];
  for(const [title,id,side] of fixtures){const plan=compositionPlans.createCompositionPlan({title,body:`Concrete scene for ${title}.`,captionSafeZonePercent:25},id);assert.equal(plan.preferredSubjectSide,side);assert.ok(plan.fallbackLayoutIds.length>0);}
});

const layoutFreshness=loadTypeScript("src/editorial/LayoutFreshness.ts");
const projectFactory=loadTypeScript("src/services/ProjectFactory.ts");
function fingerprintReadyProject(){
  let project=projectFactory.createProject("Fingerprint Test"),slide={...project.slides[0],title:"Your Antivirus Isn't Enough",body:"One infected laptop can expose files and passwords."};
  slide=compositionPlans.ensureCompositionPlan(slide);
  slide=editorialDirector.generateEditorialLayouts([slide],[],project.brandSettings.defaultCTA)[0];
  slide=layoutFreshness.withDesiredFingerprint(slide);
  const desired=layoutFreshness.slideLayoutFingerprint(slide);
  slide={...slide,background:{...slide.background,approvedImagePath:"C:\\Approved\\slide.png",approvalLocked:true},approvedImageFingerprint:desired,workingImageFingerprint:desired};
  project={...project,slides:[slide]};
  const projectFingerprint=layoutFreshness.projectLayoutFingerprint(project);
  return {...project,slideTextOverlay:{...project.slideTextOverlay,freshness:"ass-current",layoutFingerprint:projectFingerprint},finalRender:{filePath:"C:\\Video\\latest.mp4",durationSeconds:6,width:1080,height:1920,fileSizeBytes:100,renderedAt:new Date().toISOString(),layoutFingerprint:projectFingerprint},pipelineStatus:{script:"completed",images:"completed",voice:"completed",music:"completed",video:"completed",publish:"current"}};
}

test("layout change marks approved image and final video stale",()=>{
  const project=fingerprintReadyProject(),before=project.slides[0].background.approvedImagePath;
  const changedSlide={...project.slides[0],layoutTemplateId:"editorial-right",compositionPlan:compositionPlans.createCompositionPlan(project.slides[0],"editorial-right")};
  const changed={...project,slides:[changedSlide]};
  const stale=layoutFreshness.deriveLayoutStaleness(changed);
  assert.equal(stale.imageStale,true);
  assert.equal(stale.videoStale,true);
  assert.equal(stale.resumeStage,"images");
  assert.equal(changed.slides[0].background.approvedImagePath,before);
});

test("music-only change does not mark image layout stale",()=>{
  const project=fingerprintReadyProject(),changed={...project,music:{...project.music,gain:project.music.gain-.1,displayTitle:"Different music"}};
  assert.equal(layoutFreshness.deriveLayoutStaleness(changed).imageStale,false);
  assert.equal(layoutFreshness.projectLayoutFingerprint(changed),layoutFreshness.projectLayoutFingerprint(project));
});

test("versioned fingerprint changes for editorial text safe area and prompt composition",()=>{
  const project=fingerprintReadyProject(),slide=project.slides[0],base=layoutFreshness.slideLayoutFingerprint(slide);
  assert.match(base,new RegExp(`^${layoutFreshness.LAYOUT_ENGINE_VERSION}:`));
  assert.notEqual(layoutFreshness.slideLayoutFingerprint({...slide,editorialPackage:{...slide.editorialPackage,supportLine:"A different concrete support line."}}),base);
  assert.notEqual(layoutFreshness.slideLayoutFingerprint({...slide,captionSafeZonePercent:30}),base);
  const changedPlan={...slide.compositionPlan,negativeSpaceInstruction:"Reserve a much darker left side."};
  assert.notEqual(layoutFreshness.slideLayoutFingerprint({...slide,compositionPlan:changedPlan}),base);
});

test("stale ASS is regenerated while unchanged narration captions remain current",async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),"cyberslide-layout-freshness-"));
  const project=fingerprintReadyProject(),slide=project.slides[0],scenes=[{slideNumber:1,text:"One infected laptop can expose files.",sceneStartSeconds:0,sceneEndSeconds:3,paddingBeforeSeconds:0,paddingAfterSeconds:0}];
  const first=await captions.generateCaptionAssets({captionsDirectory:root,slides:[slide],scenes,narrationPath:"C:\\Audio\\Full-Narration.wav",timingPath:"C:\\Audio\\timing.json",overlaySettings:{...project.slideTextOverlay,layoutFingerprint:"layout-a"},subtitleSettings:project.subtitles,force:false});
  const second=await captions.generateCaptionAssets({captionsDirectory:root,slides:[slide],scenes,narrationPath:"C:\\Audio\\Full-Narration.wav",timingPath:"C:\\Audio\\timing.json",overlaySettings:{...first.overlay,layoutFingerprint:"layout-b"},subtitleSettings:first.subtitles,force:false});
  assert.equal(second.regenerated.overlay,true);
  assert.equal(second.regenerated.subtitles,false);
  await fs.rm(root,{recursive:true,force:true});
});

test("Generate Everything resumes at image or video according to stale fingerprint stage",()=>{
  const current=fingerprintReadyProject();
  assert.equal(layoutFreshness.deriveLayoutStaleness(current).resumeStage,"publish");
  const imageStale={...current,slides:[{...current.slides[0],approvedImageFingerprint:"legacy"}]};
  assert.equal(layoutFreshness.deriveLayoutStaleness(imageStale).resumeStage,"images");
  const textStale={...current,slideTextOverlay:{...current.slideTextOverlay,layoutFingerprint:"legacy"}};
  assert.equal(layoutFreshness.deriveLayoutStaleness(textStale).resumeStage,"video");
});

test("active video plan preserves fingerprint and renderer consumes persisted ASS geometry",()=>{
  const project=fingerprintReadyProject(),fp=layoutFreshness.projectLayoutFingerprint(project),validated=validatePlan({...buildVideoPlanForTest(project,fp),layoutFingerprint:fp});
  assert.equal(validated.layoutFingerprint,fp);
  const decision=project.slides[0].editorial.decision,ass=editorialCjs.buildEditorialAss([{...project.slides[0],number:1}],[{slideNumber:1,sceneStartSeconds:0,sceneEndSeconds:5}],project.slideTextOverlay);
  assert.match(ass,new RegExp(`\\\\pos\\(${decision.headlineAnchorPoint.x},${decision.headlineAnchorPoint.y}\\)`));
});
function buildVideoPlanForTest(project,layoutFingerprint){return {projectName:"Fingerprint Test",layoutFingerprint,scenes:[{slideNumber:1,imagePath:"C:\\Approved\\slide.png",durationSeconds:5,motion:"push",transition:"fade",transitionSeconds:.3}],overlayPath:"C:\\Captions\\slide-overlay.ass",subtitlePath:"C:\\Captions\\captions.ass"};}

test("voice freshness changes for script inputs but ignores music-only changes",()=>{
  const project=fingerprintReadyProject();
  const current=layoutFreshness.voiceInputFingerprint(project);
  assert.equal(layoutFreshness.voiceInputFingerprint({...project,music:{...project.music,gain:.1}}),current);
  assert.notEqual(layoutFreshness.voiceInputFingerprint({...project,slides:project.slides.map((slide,index)=>index===0?{...slide,editorialPackage:{...slide.editorialPackage,narration:`${slide.editorialPackage.narration} Updated narration detail.`}}:slide)}),current);
});

test("project update freshness preserves the old approved path while a replacement Working image is pending",()=>{
  const project=fingerprintReadyProject(),slide=project.slides[0],approved=slide.background.approvedImagePath;
  const changed={...slide,editorialPackage:{...slide.editorialPackage,displayHeadline:"A CHANGED\\nLAYOUT HEADLINE",highlightPhrase:"LAYOUT HEADLINE"},compositionFingerprint:null,workingImageFingerprint:"layout-first-2.0.0:new-working",background:{...slide.background,workingImagePath:"C:\\Project\\Working\\replacement.png",approvedImagePath:approved,approvalLocked:false}};
  const stale=layoutFreshness.deriveLayoutStaleness({...project,slides:[changed]});
  assert.equal(changed.background.approvedImagePath,approved);
  assert.equal(changed.background.approvalLocked,false);
  assert.equal(stale.imageStale,true);
  assert.equal(stale.videoStale,true);
});
const projectUpdateWorkflow=loadTypeScript("src/components/Pipeline/ProjectUpdateWorkflow.ts");
const queueItem=(id,number)=>({slideId:id,slideNumber:number,title:`Slide ${number}`,status:"pending",error:null,elapsedMs:0});

test("Project Update panel visibly exposes every layout selector and scoped action",async()=>{
  const source=await fs.readFile(path.join(process.cwd(),"src/components/Pipeline/ProjectUpdatePanel.tsx"),"utf8")+await fs.readFile(path.join(process.cwd(),"src/editorial/LayoutTemplates.ts"),"utf8");
  for(const text of ["Layout Template","Editorial Left","Subtitle Safe Area","Headline Style","Highlight Color","Preview Layout","Current Slide","All Slides","Update Current Slide","Update All Stale Slides"])assert.match(source,new RegExp(text));
});

test("current-slide and all-stale selection remain explicitly scoped",()=>{
  assert.deepEqual(projectUpdateWorkflow.selectUpdateSlideIds(["a","b","c"],"b","current"),["b"]);
  assert.deepEqual(projectUpdateWorkflow.selectUpdateSlideIds(["a","b","c"],"b","all"),["a","b","c"]);
});

test("timed-out image request settles as failed instead of hanging",async()=>{
  const controller=new projectUpdateWorkflow.UpdateQueueController();
  const result=await projectUpdateWorkflow.runControlledUpdateQueue({items:[queueItem("a",1)],concurrency:1,timeoutMs:10,controller,execute:()=>new Promise(()=>{}),cancelRequest:async()=>true,onChange:()=>{}});
  assert.equal(result[0].status,"failed");assert.match(result[0].error,/timed out/);
});

test("cancellation settles active and queued slides and preserves completed results",async()=>{
  const controller=new projectUpdateWorkflow.UpdateQueueController();let rejectActive;
  const run=projectUpdateWorkflow.runControlledUpdateQueue({items:[queueItem("a",1),queueItem("b",2),queueItem("c",3)],concurrency:1,timeoutMs:500,controller,execute:(item)=>item.slideId==="a"?Promise.resolve():new Promise((_,reject)=>{rejectActive=reject}),cancelRequest:async()=>{if(rejectActive)rejectActive(new Error("cancelled"));return true},onChange:()=>{}});
  await new Promise(resolve=>setTimeout(resolve,5));controller.cancel(async()=>{if(rejectActive)rejectActive(new Error("cancelled"));return true});const result=await run;
  assert.equal(result[0].status,"completed");assert.equal(result[1].status,"cancelled");assert.equal(result[2].status,"cancelled");
});

test("API failure settles queue and failed slides are retry-selectable",async()=>{
  const controller=new projectUpdateWorkflow.UpdateQueueController();
  const result=await projectUpdateWorkflow.runControlledUpdateQueue({items:[queueItem("a",1),queueItem("b",2)],concurrency:1,timeoutMs:100,controller,execute:async(item)=>{if(item.slideId==="a")throw new Error("malformed response")},cancelRequest:async()=>true,onChange:()=>{}});
  assert.equal(result[0].status,"failed");assert.equal(result[1].status,"completed");assert.deepEqual(projectUpdateWorkflow.selectRetryItems(result).map(item=>item.slideId),["a"]);
});

test("controlled concurrency never exceeds the explicitly selected limit",async()=>{
  const controller=new projectUpdateWorkflow.UpdateQueueController();let active=0,max=0;
  const result=await projectUpdateWorkflow.runControlledUpdateQueue({items:[1,2,3,4].map(n=>queueItem(String(n),n)),concurrency:2,timeoutMs:500,controller,execute:async()=>{active++;max=Math.max(max,active);await new Promise(resolve=>setTimeout(resolve,8));active--},cancelRequest:async()=>true,onChange:()=>{}});
  assert.equal(max,2);assert.ok(result.every(item=>item.status==="completed"));
});
const imageReviewWorkflow=loadTypeScript("src/imageReview/ImageReviewWorkflow.ts");
test("successful update opens Working Image Review and selects the updated slide",async()=>{const source=await fs.readFile(path.join(process.cwd(),"src/App.tsx"),"utf8");assert.match(source,/selectSlide\(successfulIds\[0\]\)/);assert.match(source,/setActiveNav\("Image Review"\)/)});
test("Working Image Review displays verified Working and Approved paths side by side",async()=>{const source=await fs.readFile(path.join(process.cwd(),"src/imageReview/WorkingImageReview.tsx"),"utf8");for(const text of ["Current Approved","New Working","Working file","Approved file","review-comparison"])assert.match(source,new RegExp(text))});
test("missing Working file is treated as generation failure before completion",async()=>{const source=await fs.readFile(path.join(process.cwd(),"src/App.tsx"),"utf8");assert.ok(source.indexOf("readSlideImage(result.filePath)")<source.indexOf("completed.set(slide.id,result)"))});
test("Approve Replacement updates the approved reference and invalidates editorial assets",()=>{const project=fingerprintReadyProject(),slide=project.slides[0],next=imageReviewWorkflow.applyApprovedReplacement({...project,slides:[{...slide,workingImageFingerprint:"new-fp"}]},slide.id,"C:\\Project\\Approved\\new.png","2026-01-01T00:00:00Z");assert.equal(next.slides[0].background.approvedImagePath,"C:\\Project\\Approved\\new.png");assert.equal(next.slides[0].approvedImageFingerprint,"new-fp");assert.equal(next.slideTextOverlay.freshness,null)});
test("replacement approval archives the previous Approved file in History",async()=>{const source=await fs.readFile(path.join(process.cwd(),"electron/main.cjs"),"utf8");assert.match(source,/workspace\.history/);assert.match(source,/historyPath/);assert.ok(source.indexOf("fs.copyFile(filePath, historyPath)")<source.indexOf("fs.copyFile(source, filePath)"))});
test("Keep Existing Approved preserves project approval",()=>{const project=fingerprintReadyProject();assert.equal(imageReviewWorkflow.keepExistingApproval(project),project)});
test("batch review advances to the next Working slide",()=>{assert.equal(imageReviewWorkflow.nextReviewSlideId(["a","b","c"],"a"),"b");assert.equal(imageReviewWorkflow.nextReviewSlideId(["a","b","c"],"c"),null)});
test("Preview Layout renders an actual image frame and composition zones",async()=>{const source=await fs.readFile(path.join(process.cwd(),"src/imageReview/WorkingImageReview.tsx"),"utf8");assert.match(source,/<img src=\{url\}/);assert.match(source,/Editorial text zone/);assert.match(source,/Subject zone/);assert.match(source,/Caption-safe zone/);assert.match(source,/Layout Preview — Not Final Video/)});
test("narrow review uses Approved and Working tabs",async()=>{const css=await fs.readFile(path.join(process.cwd(),"src/App.css"),"utf8"),source=await fs.readFile(path.join(process.cwd(),"src/imageReview/WorkingImageReview.tsx"),"utf8");assert.match(css,/@media\(max-width:800px\)/);assert.match(css,/tab-working/);assert.match(source,/review-tabs/)});
const editorialPackageDirector=loadTypeScript("src/editorial/EditorialPackageDirector.ts");
test("Script Director generates a complete valid Editorial Package",()=>{const pkg=editorialPackageDirector.generateEditorialPackage({title:"Your Phone Number Can Be Stolen",body:"A criminal can move your number to another device without touching your phone.",cta:"Follow for more."});assert.ok(pkg.displayHeadline.includes("\n"));assert.ok(pkg.highlightPhrase);assert.ok(pkg.displayHeadline.replace(/\n/g," ").includes(pkg.highlightPhrase));assert.ok(pkg.supportLine);assert.ok(pkg.narration);assert.ok(pkg.posterPrompt);assert.ok(pkg.motionHint);assert.ok(pkg.captionHint);assert.deepEqual(editorialPackageDirector.validateEditorialPackage(pkg),[])});
test("Editorial Package validation rejects long headlines missing highlights and narration",()=>{const pkg=editorialPackageDirector.generateEditorialPackage({title:"Short Headline",body:"Useful explanation for a beginner."});const errors=editorialPackageDirector.validateEditorialPackage({...pkg,displayHeadline:"ONE TWO THREE FOUR FIVE SIX SEVEN EIGHT NINE",highlightPhrase:"MISSING",narration:""});assert.ok(errors.some(e=>/eight words/i.test(e)));assert.ok(errors.some(e=>/must appear/i.test(e)));assert.ok(errors.some(e=>/Narration/i.test(e)))});
test("renderer uses Editorial Package and ignores legacy Title and Body",()=>{const slide=projectFactory.createSlide(1),pkg={...slide.editorialPackage,displayHeadline:"PACKAGE\nHEADLINE",highlightPhrase:"HEADLINE",supportLine:"Package support adds specific context.",narration:"Independent spoken narration."},editorial=editorialDirector.generateEditorialLayouts([{...slide,title:"POISON TITLE",body:"POISON BODY",editorialPackage:pkg}],[],"Click the Follow button to see new cybersecurity tips every day.")[0].editorial,ass=editorialCjs.buildEditorialAss([{number:1,title:"POISON TITLE",body:"POISON BODY",editorialPackage:pkg,editorial}],[{slideNumber:1,sceneStartSeconds:0,sceneEndSeconds:3}],{});assert.match(ass,/PACKAGE/);assert.match(ass,/HEADLINE/);assert.match(ass,/Package\\Nsupport/);assert.doesNotMatch(ass,/POISON TITLE|POISON BODY/)});
test("renderer preserves manual Editorial Package line breaks exactly",()=>{const slide=projectFactory.createSlide(1),pkg={...slide.editorialPackage,displayHeadline:"ONE CLICK\nCAN INFECT\nYOUR BUSINESS",highlightPhrase:"ONE CLICK",supportLine:"A single attachment can spread malware across connected devices.",narration:"Here is the narration."},result=editorialDirector.generateEditorialLayouts([{...slide,editorialPackage:pkg}],[],"Click the Follow button to see new cybersecurity tips every day.")[0];assert.deepEqual(result.editorial.headlineLines.map(line=>line.text),["ONE CLICK","CAN INFECT","YOUR BUSINESS"])});
test("legacy project migration creates one editable Editorial Package",()=>{const base=projectFactory.createProject("Legacy Editorial"),legacy={...base,slides:base.slides.map(({editorialPackage,...slide})=>({...slide,title:"Legacy Title",body:"Legacy body explains the topic clearly.",editorial:{...editorialDirector.generateEditorialLayouts([{...slide,title:"Legacy Title",body:"Legacy body explains the topic clearly.",editorialPackage}],[],"Click the Follow button to see new cybersecurity tips every day.")[0].editorial,displayHeadline:"MANUAL\nLEGACY HEADLINE",emphasizedText:"LEGACY HEADLINE",supportingLine:"Existing manual support remains intact.",manualOverride:true}}))},migrated=loadTypeScript("src/services/ProjectFileService.ts").deserializeProject(JSON.stringify(legacy));assert.equal(migrated.slides[0].editorialPackage.displayHeadline,"MANUAL\nLEGACY HEADLINE");assert.equal(migrated.slides[0].editorialPackage.manuallyEdited,true)});
test("voice renderer consumes Editorial Package narration only",async()=>{const source=await fs.readFile(path.join(process.cwd(),"electron/voice/registerVoiceHandlers.cjs"),"utf8");assert.match(source,/editorialPackage\?\.narration/);const helper=source.slice(source.indexOf("function narrationForSlide"),source.indexOf("function registerCyberSlideVoiceHandlers"));assert.doesNotMatch(helper,/slide\?\.title|slide\?\.body/)});