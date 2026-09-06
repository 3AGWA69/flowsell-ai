import { NextRequest, NextResponse } from 'next/server';

type Product = { id: string; name: string; category: string; price: number; cost: number; stock: number; color?: string; active: boolean };
type Category = { id: string; name: string };
type Order = { id: string; customer: string; phone: string; address: string; items: any[]; total: number; status: string; createdAt: string };
type StoreData = { products: Product[]; categories: Category[]; orders: Order[] };

const seed: StoreData = { categories: [{id:'cat-bags',name:'شنط'},{id:'cat-jewelry',name:'إكسسوارات'},{id:'cat-perfume',name:'عطور'},{id:'cat-eyewear',name:'نظارات'}], products: [
{id:'p1',name:'حقيبة Luna Mini',category:'شنط',price:890,cost:540,stock:7,color:'أسود',active:true},{id:'p2',name:'سوار Pearl Twist',category:'إكسسوارات',price:420,cost:210,stock:18,color:'ذهبي',active:true},{id:'p3',name:'عطر Velvet 50ml',category:'عطور',price:760,cost:390,stock:11,color:'',active:true},{id:'p4',name:'نظارة Aura',category:'نظارات',price:640,cost:300,stock:5,color:'بني',active:true}], orders: [] };
let memory: StoreData = structuredClone(seed);
const db = () => Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

async function supabase(path: string, init?: RequestInit) { const url=process.env.SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE_KEY; if(!url||!key)return null; const res=await fetch(`${url}/rest/v1/${path}`,{...init,headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'return=representation',...(init?.headers||{})},cache:'no-store'}); if(!res.ok)throw new Error(await res.text()); return res.json(); }
async function readData():Promise<StoreData>{ if(!db())return memory; const [products,categories,orders]=await Promise.all([supabase('products?select=*&order=created_at.desc'),supabase('categories?select=*&order=name.asc'),supabase('orders?select=*&order=created_at.desc')]); return {products:products||[],categories:categories||[],orders:orders||[]}; }
export async function GET(){try{return NextResponse.json({...await readData(),persisted:db()});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Database error'},{status:500});}}

export async function POST(req:NextRequest){try{const body=await req.json(), action=body.action;
 if(action==='product'){const product={name:body.name,category:body.category||'عام',price:Number(body.price),cost:Number(body.cost||0),stock:Number(body.stock||0),color:body.color||'',active:body.active!==false}; if(db()){if(body.id)await supabase(`products?id=eq.${encodeURIComponent(body.id)}`,{method:'PATCH',body:JSON.stringify(product)});else await supabase('products',{method:'POST',body:JSON.stringify(product)});}else{const p={...product,id:body.id||`p-${Date.now()}`};const i=memory.products.findIndex(x=>x.id===p.id);if(i>=0)memory.products[i]=p;else memory.products.unshift(p);return NextResponse.json({ok:true,product:p});} return NextResponse.json({ok:true});}
 if(action==='deleteProduct'){if(db())await supabase(`products?id=eq.${encodeURIComponent(body.id)}`,{method:'DELETE'});else memory.products=memory.products.filter(p=>p.id!==body.id);return NextResponse.json({ok:true});}
 if(action==='category'){if(db()){if(body.id)await supabase(`categories?id=eq.${encodeURIComponent(body.id)}`,{method:'PATCH',body:JSON.stringify({name:body.name})});else await supabase('categories',{method:'POST',body:JSON.stringify({name:body.name})});}else{const c={id:body.id||`cat-${Date.now()}`,name:body.name};const i=memory.categories.findIndex(x=>x.id===c.id);if(i>=0)memory.categories[i]=c;else memory.categories.push(c);}return NextResponse.json({ok:true});}
 if(action==='order'){const payload={customer:body.customer||'عميل جديد',phone:body.phone||'',address:body.address||'',items:body.items||[],total:Number(body.total||0),status:'new'};if(db()){const created=await supabase('orders',{method:'POST',body:JSON.stringify(payload)});return NextResponse.json({ok:true,order:created?.[0]||payload});}const order={...payload,id:`ord-${Date.now()}`,createdAt:new Date().toISOString()};memory.orders.unshift(order);for(const item of order.items){const p=memory.products.find(x=>x.id===item.productId);if(p)p.stock=Math.max(0,p.stock-Number(item.qty||0));}return NextResponse.json({ok:true,order});}
 if(action==='orderStatus'){if(db())await supabase(`orders?id=eq.${encodeURIComponent(body.id)}`,{method:'PATCH',body:JSON.stringify({status:body.status})});else{const o=memory.orders.find(x=>x.id===body.id);if(o)o.status=body.status;}return NextResponse.json({ok:true});}
 return NextResponse.json({error:'Unknown action'},{status:400});
}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Request failed'},{status:500});}}
