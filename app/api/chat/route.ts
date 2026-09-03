import { NextResponse } from 'next/server'
import { runDemoAgent } from '@/lib/agent'
import { runLLMAgent } from '@/lib/ai'
import type { CartItem } from '@/types'
export async function POST(req:Request){
 try{const body=await req.json();const message=String(body.message||'').trim();const cart=(body.cart||[]) as CartItem[];if(!message)return NextResponse.json({error:'Message is required'},{status:400});const ai=await runLLMAgent(message,cart);if(ai)return NextResponse.json({mode:'llm',...ai,cart});const demo=runDemoAgent(message,cart);return NextResponse.json({mode:'demo',...demo})}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Agent error'},{status:500})}
}
