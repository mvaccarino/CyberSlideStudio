const fs=require("node:fs/promises");const path=require("node:path");
async function copyMissingAssets(legacy,current){await fs.mkdir(current,{recursive:true});try{for(const file of await fs.readdir(legacy)){const source=path.join(legacy,file),target=path.join(current,file);try{await fs.access(target);}catch{const stat=await fs.stat(source);if(stat.isFile())await fs.copyFile(source,target);}}}catch(error){if(error?.code!=="ENOENT")throw error;}}
async function migrateLegacyAssets(workspace){await copyMissingAssets(workspace.legacyDraft,workspace.working);await copyMissingAssets(workspace.legacyFinal,workspace.approved);}
module.exports={copyMissingAssets,migrateLegacyAssets};
