import type {buildAssistantChatPayload} from './assistant-context'
import type {Answers} from './checkin-api'
import type {RecommendationItem} from './policy-api'
export type ChatReply = {
 replies:string[]; checkin:Answers; checkin_update:Answers; needs:string[];
 choices:{type:'message'|'answer';label:string;text?:string;question_id?:string;code?:string}[];
 results:{policies:RecommendationItem[];programs:RecommendationItem[]}|null;
}
export async function requestAssistantChat(payload:ReturnType<typeof buildAssistantChatPayload>&{selected_item_id?:string},signal:AbortSignal):Promise<ChatReply> {
 const base=(import.meta.env.VITE_API_BASE_URL||'').replace(/\/$/,'')
 const response=await fetch(`${base}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.any([signal,AbortSignal.timeout(30000)])})
 if(!response.ok)throw new Error(`API ${response.status}`)
 const data=await response.json()
 if(!Array.isArray(data.replies)||!data.replies.every((text:unknown)=>typeof text==='string'))throw new Error('Invalid chat response')
 return data
}
