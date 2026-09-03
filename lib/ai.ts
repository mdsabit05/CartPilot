import { getProduct, searchProducts } from './products'
import type { CartItem } from '@/types'

const tools = [
 {type:'function',function:{name:'search_products',description:'Search the catalog using natural language and an optional budget.',parameters:{type:'object',properties:{query:{type:'string'},maxPrice:{type:'number'}},required:['query']}}},
 {type:'function',function:{name:'get_product_details',description:'Get one catalog product by id.',parameters:{type:'object',properties:{id:{type:'string'}},required:['id']}}},
 {type:'function',function:{name:'compare_products',description:'Compare products by ids.',parameters:{type:'object',properties:{ids:{type:'array',items:{type:'string'}}},required:['ids']}}},
 {type:'function',function:{name:'add_to_cart',description:'Add a product to the current cart.',parameters:{type:'object',properties:{id:{type:'string'},quantity:{type:'number'}},required:['id']}}},
 {type:'function',function:{name:'remove_from_cart',description:'Remove a product from the current cart.',parameters:{type:'object',properties:{id:{type:'string'}},required:['id']}}},
 {type:'function',function:{name:'get_cart',description:'Return the current cart and totals.',parameters:{type:'object',properties:{}}}},
 {type:'function',function:{name:'find_best_offer',description:'Find the current best cart offer.',parameters:{type:'object',properties:{}}}},
]
const money=(n:number)=>`₹${n.toLocaleString('en-IN')}`
export async function runLLMAgent(message:string, cart:CartItem[]){
 const key=process.env.OPENAI_API_KEY
 if(!key) return null
 const model=process.env.OPENAI_MODEL||'gpt-4o-mini'
 const messages:any[]=[{role:'system',content:`You are CartPilot, an AI commerce agent. Use tools for catalog/cart facts. Never invent product data, prices, stock, discounts or payment success. Be concise. Maintain context from the user's provided conversation state. When recommending, explain the catalog facts used. Current cart JSON: ${JSON.stringify(cart)}`},{role:'user',content:message}]
 for(let step=0;step<5;step++){
   const res=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},body:JSON.stringify({model,messages,tools,tool_choice:'auto',temperature:.2})})
   if(!res.ok) throw new Error(`LLM request failed: ${res.status}`)
   const data=await res.json(); const msg=data.choices?.[0]?.message
   if(!msg) throw new Error('LLM returned no message')
   messages.push(msg)
   if(!msg.tool_calls?.length) return {text:msg.content||'I could not generate a response.'}
   for(const tc of msg.tool_calls){
     const args=JSON.parse(tc.function.arguments||'{}'); let result:any
     if(tc.function.name==='search_products'){
       const found=searchProducts(`${args.query||''}${args.maxPrice?` under ${args.maxPrice}`:''}`); result={products:found}
     } else if(tc.function.name==='get_product_details') result={product:getProduct(args.id)}
     else if(tc.function.name==='compare_products') result={products:(args.ids||[]).map((id:string)=>getProduct(id)).filter(Boolean)}
     else if(tc.function.name==='add_to_cart') { const p=getProduct(args.id); if(p){const qty=Math.max(1,Math.floor(args.quantity||1));const idx=cart.findIndex(x=>x.id===p.id);if(idx>=0)cart[idx]={...cart[idx],quantity:cart[idx].quantity+qty};else cart.push({...p,quantity:qty});result={cart,message:`Added ${p.name}.`}} else result={error:'Product not found'} }
     else if(tc.function.name==='remove_from_cart'){const idx=cart.findIndex(x=>x.id===args.id);if(idx>=0)cart.splice(idx,1);result={cart}}
     else if(tc.function.name==='get_cart'){const subtotal=cart.reduce((n,x)=>n+x.price*x.quantity,0);const discount=subtotal>=5000?Math.round(subtotal*.1):0;result={cart,subtotal,discount,total:subtotal-discount}}
     else if(tc.function.name==='find_best_offer'){const subtotal=cart.reduce((n,x)=>n+x.price*x.quantity,0);result=subtotal>=5000?{offer:'10% off',discount:Math.round(subtotal*.1)}:{offer:'10% off above ₹5,000',gap:Math.max(0,5000-subtotal)}}
     messages.push({role:'tool',tool_call_id:tc.id,content:JSON.stringify(result)})
   }
 }
 return {text:'I reached the action limit. Please try that request again.'}
}
