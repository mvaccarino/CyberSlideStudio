const { dialog, ipcMain, shell } = require("electron");
const path = require("node:path");
const { copyCustom, ensureLibrary, prepareAudio, scanLibrary, selectTrack } = require("./musicDirector.cjs");
function registerMusicHandlers({ensureWorkspace}){
 ipcMain.handle("music:scan",()=>scanLibrary());
 ipcMain.handle("music:auto-select",(_e,p)=>selectTrack(p||{}));
 ipcMain.handle("music:select-custom",async(_e,p)=>{const result=await dialog.showOpenDialog({properties:["openFile"],filters:[{name:"Audio",extensions:["mp3","wav","m4a","aac","flac"]}]});if(result.canceled||!result.filePaths[0])return null;const workspace=await ensureWorkspace(p?.projectName);return copyCustom(result.filePaths[0],workspace.audio);});
 ipcMain.handle("music:prepare",async(_e,p)=>{const workspace=await ensureWorkspace(p?.projectName);return prepareAudio({...p,audioRoot:workspace.audio});});
 ipcMain.handle("music:open-library",async()=>{const root=await ensureLibrary();await shell.openPath(root);return root;});
 ipcMain.handle("music:open-audio-folder",async(_e,name)=>{const workspace=await ensureWorkspace(name);await shell.openPath(workspace.audio);return workspace.audio;});
}
module.exports={registerMusicHandlers};
