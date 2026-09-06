'use client';

import { useEffect, useMemo, useState } from 'react';
import { PackagePlus, Trash2, RefreshCw, ShoppingCart, Users, Boxes, Plus, Save } from 'lucide-react';

type Product = { id:string; name:string; category:string; price:number; cost:number; stock:number; color?:string; active:boolean };
type Category = { id:string; name:string };
type Order = { id:string; customer:string; phone:string; address:string; items:any[]; total:number; status:string; createdAt:string };

export default function Dashboard(){
 const [products,setProducts]=useState<Product[]>([]); const [categories,setCategories]=useState<Category[]>([]); const [orders,setOrders]=useState<Order[]>([]); const [tab,setTab]=useState('products'); const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false);
 const [form,setForm]=useState({name:'',category:'شنط',price:'',cost:'',stock:'',color:''}); const [cat,setCat]=useState('');
 const load=async()=>{setLoading(true); const r=await fetch('/api/store',{cache:'no-store'}); const d=await r.json(); setProducts(d.products||[]); setCategories(d.categories||[]); setOrders(d.orders||[]); setLoading(false)};
 useEffect(()=>{load()},[]);
 const addProduct=async()=>{if(!form.name||!form.price)return;setSaving(true);await fetch('/api/store',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'product',...form})});setForm({name:'',category:categories[0]?.name||'عام',price:'',cost:'',stock:'',color:''});await load();setSaving(false)};
 const remove=async(id:string)=>{await fetch('/api/store',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'deleteProduct',id})});load()};
 const addCategory=async()=>{if(!cat)return;await fetch('/api/store',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'category',name:cat})});setCat('');load()};
 const revenue=useMemo(()=>orders.reduce((s,o)=>s+Number(o.total||0),0),[orders]);
 return <main dir="rtl" style={{minHeight:'100vh',background:'#f7f6f2',color:'#111',padding:'28px',fontFamily:'Arial,sans-serif'}}>
  <div style={{maxWidth:1200,margin:'auto'}}>
   <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}><div><div style={{fontSize:13,color:'#777'}}>FlowSell AI</div><h1 style={{margin:'4px 0',fontSize:34}}>لوحة التحكم</h1><div style={{color:'#777'}}>إدارة المنتجات والمخزون والطلبات</div></div><button onClick={load} style={btn}><RefreshCw size={16}/> تحديث</button></header>
   <section style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>{[[products.length,'المنتجات',Boxes],[products.reduce((s,p)=>s+p.stock,0),'إجمالي المخزون',PackagePlus],[orders.length,'الطلبات',ShoppingCart],[revenue.toLocaleString('ar-EG')+' ج','المبيعات',Users]].map(([v,t,I]:any)=><div style={card} key={t}><I size={19}/><span style={{color:'#777',fontSize:13}}>{t}</span><b style={{fontSize:25}}>{v}</b></div>)}</section>
   <nav style={{display:'flex',gap:8,marginBottom:16}}>{[['products','المنتجات'],['orders','الطلبات'],['categories','التصنيفات']].map(([k,t])=><button key={k} onClick={()=>setTab(k)} style={{...btn,background:tab===k?'#111':'#fff',color:tab===k?'#fff':'#111'}}>{t}</button>)}</nav>
   {tab==='products'&&<>
    <section style={{...card,marginBottom:16}}><h3 style={{marginTop:0}}>إضافة منتج</h3><div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1fr auto',gap:8}}>{[['name','اسم المنتج'],['price','سعر البيع'],['cost','سعر الشراء'],['stock','المخزون'],['color','اللون']].map(([k,p])=><input key={k} placeholder={p} value={(form as any)[k]} onChange={e=>setForm({...form,[k]:e.target.value})} style={input}/>)}<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} style={input}>{categories.map(c=><option key={c.id}>{c.name}</option>)}</select><button disabled={saving} onClick={addProduct} style={darkBtn}><Save size={16}/> حفظ</button></div></section>
    <section style={card}>{loading?'جاري التحميل...':<table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th style={th}>المنتج</th><th style={th}>التصنيف</th><th style={th}>البيع</th><th style={th}>الشراء</th><th style={th}>المخزون</th><th style={th}></th></tr></thead><tbody>{products.map(p=><tr key={p.id}><td style={td}><b>{p.name}</b><div style={{fontSize:12,color:'#888'}}>{p.color}</div></td><td style={td}>{p.category}</td><td style={td}>{Number(p.price).toLocaleString('ar-EG')} ج</td><td style={td}>{Number(p.cost).toLocaleString('ar-EG')} ج</td><td style={td}><b>{p.stock}</b></td><td style={td}><button onClick={()=>remove(p.id)} style={{...iconBtn,color:'#b00'}}><Trash2 size={16}/></button></td></tr>)}</tbody></table>}</section>
   </>}
   {tab==='orders'&&<section style={card}><h3 style={{marginTop:0}}>الطلبات</h3>{orders.length===0?<div style={{color:'#888'}}>لسه مفيش طلبات. أول طلب من الـAI هيظهر هنا.</div>:orders.map(o=><div key={o.id} style={{borderBottom:'1px solid #eee',padding:'14px 0',display:'flex',justifyContent:'space-between'}}><div><b>{o.customer}</b><div style={{color:'#777',fontSize:13}}>{o.phone} • {o.address}</div></div><div><b>{Number(o.total).toLocaleString('ar-EG')} ج</b><div style={{fontSize:12,color:'#777'}}>{o.status}</div></div></div>)}</section>}
   {tab==='categories'&&<section style={card}><h3 style={{marginTop:0}}>التصنيفات</h3><div style={{display:'flex',gap:8,marginBottom:16}}><input value={cat} onChange={e=>setCat(e.target.value)} placeholder="اسم التصنيف" style={{...input,maxWidth:300}}/><button onClick={addCategory} style={darkBtn}><Plus size={16}/> إضافة</button></div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{categories.map(c=><span key={c.id} style={{padding:'8px 12px',background:'#eee',borderRadius:20}}>{c.name}</span>)}</div></section>}
   <div style={{marginTop:20,padding:16,background:'#111',color:'#fff',borderRadius:14}}>AI Chat API جاهز. لو أضفت <b>OPENAI_API_KEY</b> سيستخدم الذكاء الاصطناعي، وإلا سيعمل تلقائيًا على بيانات الكتالوج بدون اختراع أسعار أو مخزون.</div>
  </div>
 </main>
}
const card:any={background:'#fff',border:'1px solid #e6e4de',borderRadius:16,padding:18,boxShadow:'0 4px 18px rgba(0,0,0,.03)'};
const btn:any={border:'1px solid #ddd',background:'#fff',borderRadius:10,padding:'10px 14px',display:'inline-flex',gap:7,alignItems:'center',cursor:'pointer'};
const darkBtn:any={...btn,background:'#111',color:'#fff',borderColor:'#111'};
const input:any={border:'1px solid #ddd',borderRadius:9,padding:'11px',outline:'none',minWidth:0};
const th:any={textAlign:'right',padding:'10px',borderBottom:'1px solid #eee',color:'#777',fontSize:13}; const td:any={textAlign:'right',padding:'12px 10px',borderBottom:'1px solid #f0efeb'}; const iconBtn:any={border:0,background:'transparent',cursor:'pointer'};
