export type ProjectUpdateResult = { success:boolean;slideId:string;workingImagePath:string|null;approvedImagePath:string|null;warnings:string[];validationResult:unknown;error:string|null };
export type UpdateQueueStatus = "pending" | "active" | "completed" | "failed" | "cancelled";
export type UpdateQueueItem = { slideId: string; slideNumber: number; title: string; status: UpdateQueueStatus; error: string | null; elapsedMs: number };
export type UpdateQueueSnapshot = { running: boolean; cancelled: boolean; stage: string; startedAt: number | null; currentSlide: number | null; items: UpdateQueueItem[] };
export const idleUpdateQueue = (): UpdateQueueSnapshot => ({ running:false,cancelled:false,stage:"Waiting",startedAt:null,currentSlide:null,items:[] });
export const selectUpdateSlideIds=(allIds:string[],currentId:string|null,scope:"current"|"all")=>scope==="current"&&currentId?[currentId]:allIds;
export const selectRetryItems=(items:UpdateQueueItem[])=>items.filter(item=>item.status==="failed");
export class UpdateQueueController {
  cancelled=false;
  activeRequestIds=new Set<string>();
  cancel(cancelRequest:(requestId:string)=>Promise<boolean>){this.cancelled=true;for(const id of this.activeRequestIds)void cancelRequest(id).catch(()=>false)}
}
export async function runControlledUpdateQueue(options:{
  items:UpdateQueueItem[];
  concurrency:1|2;
  timeoutMs:number;
  controller:UpdateQueueController;
  execute:(item:UpdateQueueItem,requestId:string)=>Promise<void>;
  cancelRequest:(requestId:string)=>Promise<boolean>;
  onChange:(items:UpdateQueueItem[],currentSlide:number|null,stage:string)=>void;
}):Promise<UpdateQueueItem[]>{
  const items=options.items.map(item=>({...item}));let cursor=0;
  const notify=(currentSlide:number|null,stage:string)=>options.onChange(items.map(item=>({...item})),currentSlide,stage);
  const worker=async()=>{
    while(cursor<items.length&&!options.controller.cancelled){
      const index=cursor++;const item=items[index],requestId=`layout-${item.slideId}-${Date.now()}-${index}`;const started=Date.now();
      item.status="active";options.controller.activeRequestIds.add(requestId);notify(item.slideNumber,"Generating layout-aware image");
      let timer:ReturnType<typeof setTimeout>|undefined;
      try{
        const timeout=new Promise<never>((_,reject)=>{timer=setTimeout(()=>{void options.cancelRequest(requestId);reject(new Error(`Image request timed out after ${Math.round(options.timeoutMs/1000)} seconds.`))},options.timeoutMs)});
        await Promise.race([options.execute(item,requestId),timeout]);
        item.status=options.controller.cancelled?"cancelled":"completed";
      }catch(error){item.status=options.controller.cancelled?"cancelled":"failed";item.error=error instanceof Error?error.message:"Image update failed."}
      finally{if(timer)clearTimeout(timer);item.elapsedMs=Date.now()-started;options.controller.activeRequestIds.delete(requestId);notify(null,item.status==="failed"?"Slide failed":"Preparing next slide")}
    }
  };
  await Promise.all(Array.from({length:Math.min(options.concurrency,Math.max(1,items.length))},worker));
  if(options.controller.cancelled)for(const item of items)if(item.status==="pending")item.status="cancelled";
  notify(null,options.controller.cancelled?"Cancelled":"Update complete");return items;
}