'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, Bot, Check, ChevronLeft, Clock3, MessageCircle, Package, Phone, Plus, Send, ShoppingBag, Sparkles, Users, Zap } from 'lucide-react';

const products = [
  { id: 1, name: 'حقيبة Luna Mini', price: 890, color: 'أسود', stock: 7 },
  { id: 2, name: 'سوار Pearl Twist', price: 420, color: 'ذهبي', stock: 18 },
  { id: 3, name: 'عطر Velvet 50ml', price: 760, color: '—', stock: 11 },
  { id: 4, name: 'نظارة Aura', price: 640, color: 'بني', stock: 5 },
];

const conversations = [
  { id: 1, name: 'سارة محمد', text: 'عايزة حقيبة Luna Mini بالأسود', time: 'الآن', status: 'ساخن', initials: 'س' },
  { id: 2, name: 'عمر علي', text: 'التوصيل للقاهرة بكام؟', time: 'منذ 8 د', status: 'متابعة', initials: 'ع' },
  { id: 3, name: 'نور أحمد', text: 'هل السوار متاح؟', time: 'منذ 21 د', status: 'جديد', initials: 'ن' },
  { id: 4, name: 'مريم حسن', text: 'ممكن صور أكتر؟', time: 'منذ 34 د', status: 'متابعة', initials: 'م' },
];

const autoReplies: Record<string, string> = {
  'سعر': 'أكيد ❤️ حقيبة Luna Mini سعرها 890 جنيه، ومتاح منها الأسود حاليًا. التوصيل داخل القاهرة بـ60 جنيه.',
  'متاح': 'أيوه متاح ✅ عندنا 7 قطع حاليًا. تحبي أجهز لك الطلب؟',
  'توصيل': 'التوصيل داخل القاهرة 60 جنيه، والجيزة 70 جنيه. باقي المحافظات حسب شركة الشحن.',
  'طلب': 'تمام جدًا. ابعتي الاسم + رقم الموبايل + العنوان، وأنا أسجل الطلب فورًا ✅',
};

export default function Home() {
  const [tab, setTab] = useState<'home'|'demo'|'dashboard'>('home');
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([
    { from: 'bot', text: 'أهلًا بيكي 👋 أنا مساعد FlowSell. أقدر أساعدك في الأسعار، التوفر، التوصيل وتسجيل الطلب.' },
    { from: 'user', text: 'بكام حقيبة Luna Mini؟' },
    { from: 'bot', text: autoReplies['سعر'] },
  ]);
  const [leads, setLeads] = useState(128);
  const [orders, setOrders] = useState(34);

  const send = () => {
    const value = message.trim();
    if (!value) return;
    const key = Object.keys(autoReplies).find(k => value.includes(k));
    const reply = key ? autoReplies[key] : 'تمام 👍 ابعتي اسم المنتج أو اسألي عن السعر أو التوصيل، وأنا هساعدك فورًا.';
    setChat(c => [...c, { from: 'user', text: value }, { from: 'bot', text: reply }]);
    setMessage('');
    setLeads(v => v + 1);
  };

  const revenue = useMemo(() => (orders * 680).toLocaleString('ar-EG'), [orders]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand" onClick={() => setTab('home')}><div className="brand-mark"><Sparkles size={18}/></div><div><div className="brand-name">FlowSell <span>AI</span></div><div className="brand-sub">Sales Automation for Stores</div></div></div>
        <nav>
          <button className={tab==='home'?'active':''} onClick={()=>setTab('home')}>الرئيسية</button>
          <button className={tab==='demo'?'active':''} onClick={()=>setTab('demo')}>جرّب المساعد</button>
          <button className={tab==='dashboard'?'active':''} onClick={()=>setTab('dashboard')}>لوحة التحكم</button>
        </nav>
        <button className="top-cta" onClick={()=>setTab('demo')}>شوف الـ Demo <ArrowLeft size={16}/></button>
      </header>

      {tab==='home' && <>
        <section className="hero">
          <div className="hero-copy">
            <div className="pill"><span className="dot"></span> AI Sales Assistant جاهز لمتجرك</div>
            <h1>خلي الذكاء الاصطناعي<br/><em>يبيع بدالك.</em></h1>
            <p>FlowSell يرد على العملاء، يشرح المنتجات، يجمع الطلبات ويتابع العملاء تلقائيًا — 24/7.</p>
            <div className="hero-actions"><button className="primary" onClick={()=>setTab('demo')}>جرّب المساعد الآن <ArrowLeft size={18}/></button><button className="ghost" onClick={()=>setTab('dashboard')}>شوف لوحة التحكم</button></div>
            <div className="trust"><div className="avatar-stack"><span>أ</span><span>م</span><span>س</span><span>ن</span></div><span>مبني لمتاجر السوشيال في مصر</span></div>
          </div>
          <div className="hero-card">
            <div className="card-glow"></div>
            <div className="phone-head"><div><div className="live"><span></span> متصل الآن</div><strong>متجر Luna</strong></div><div className="bot-mini"><Bot size={19}/></div></div>
            <div className="phone-chat">
              <div className="bubble customer">هاي، عايزة أعرف سعر الـ Luna Mini 👀</div>
              <div className="bubble bot">أهلًا ❤️ سعرها <b>890 جنيه</b> ومتاح الأسود حاليًا. تحبي أجهز لك الطلب؟</div>
              <div className="bubble customer">أيوه، وعايزة أعرف التوصيل كمان</div>
              <div className="bubble bot">داخل القاهرة <b>60 جنيه</b> والتوصيل خلال 24–48 ساعة 🚚</div>
            </div>
            <div className="phone-input"><span>اكتب رسالة...</span><div className="send-dot"><Send size={15}/></div></div>
            <div className="ai-badge"><Zap size={13}/> مدعوم بالذكاء الاصطناعي</div>
          </div>
        </section>

        <section className="stats-row">
          {[[<MessageCircle/>, 'رد فوري', 'بدون انتظار'],[<Clock3/>, '24/7', 'بدون إجازات'],[<ShoppingBag/>, 'مبيعات أكثر', 'متابعة تلقائية']].map(([icon,title,sub],i)=><div className="stat" key={i}>{icon}<div><b>{title}</b><span>{sub}</span></div></div>)}
        </section>

        <section className="section dark">
          <div className="section-title"><div className="eyebrow">ليه FlowSell؟</div><h2>مش Chatbot.<br/><span>موظف مبيعات كامل.</span></h2></div>
          <div className="feature-grid">
            {[[<MessageCircle/>, 'رد على العملاء', 'يفهم المصري والإنجليزي ويرد في ثواني.'],[<Package/>, 'بيانات المنتجات', 'الأسعار، التوفر، الألوان والمقاسات.'],[<Users/>, 'تأهيل العملاء', 'يفرق بين الاستفسار والعميل الجاهز للشراء.'],[<Zap/>, 'متابعة تلقائية', 'يرجع للعميل لو ساب المحادثة بدون طلب.']].map(([i,t,d])=><div className="feature" key={t as string}><div className="feature-icon">{i}</div><h3>{t}</h3><p>{d}</p></div>)}
          </div>
        </section>

        <section className="pricing"><div className="pricing-copy"><div className="eyebrow">ابدأ صغير</div><h2>أول نظام مبيعات<br/>AI لمتجرك.</h2><p>Setup بسيط، بدون بناء منصة من الصفر. نركب النظام على بيانات منتجاتك ونجهزه للبيع.</p></div><div className="price-card"><div className="price-label">باقة البداية</div><div className="price">2,500 <span>جنيه</span></div><div className="price-note">مرة واحدة — لأول العملاء</div><div className="price-list"><span><Check/> إعداد المساعد</span><span><Check/> إدخال حتى 30 منتج</span><span><Check/> سيناريوهات الرد والبيع</span><span><Check/> Dashboard مبدئي</span></div><button className="primary full" onClick={()=>setTab('demo')}>احجز تجربة Demo <ArrowLeft size={18}/></button></div></section>
      </>}

      {tab==='demo' && <section className="workbench"><div className="page-heading"><div><div className="eyebrow">Live Demo</div><h2>جرّب موظف المبيعات بنفسك</h2><p>المحادثة دي تحاكي عميل حقيقي بيسأل عن منتجات متجرك.</p></div><button className="ghost" onClick={()=>setTab('home')}>رجوع</button></div><div className="demo-layout"><div className="chat-panel"><div className="panel-head"><div className="bot-mini"><Bot size={18}/></div><div><b>FlowSell AI</b><span>متجر Luna • متصل</span></div><span className="green-dot"></span></div><div className="chat-body">{chat.map((m,i)=><div key={i} className={'chat-line '+m.from}><div className="chat-bubble">{m.text}</div></div>)}</div><div className="suggestions"><button onClick={()=>setMessage('السعر كام؟')}>السعر كام؟</button><button onClick={()=>setMessage('هل متاح؟')}>هل متاح؟</button><button onClick={()=>setMessage('التوصيل بكام؟')}>التوصيل بكام؟</button></div><div className="composer"><input value={message} onChange={e=>setMessage(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="اكتب رسالة للـ AI..."/><button onClick={send}><Send size={17}/></button></div></div><div className="demo-side"><div className="mini-card"><div className="mini-head"><span>المنتجات</span><Plus size={16}/></div>{products.map(p=><div className="product-row" key={p.id}><div className="product-thumb"></div><div><b>{p.name}</b><span>{p.price.toLocaleString('ar-EG')} ج • {p.stock} في المخزن</span></div></div>)}</div><div className="mini-card result"><div className="result-icon"><Check/></div><div><b>الطلب جاهز للتحويل</b><span>العميل مؤهل للشراء بعد سؤالين فقط.</span></div></div></div></div></section>}

      {tab==='dashboard' && <section className="dashboard"><div className="page-heading"><div><div className="eyebrow">Store Dashboard</div><h2>لوحة تحكم المبيعات</h2><p>نظرة سريعة على أداء المساعد والعملاء والطلبات.</p></div><button className="primary" onClick={()=>setTab('demo')}>اختبر المساعد <ArrowLeft size={17}/></button></div><div className="kpi-grid"><div className="kpi"><span>العملاء الجدد</span><b>{leads}</b><small>+18% هذا الشهر</small></div><div className="kpi"><span>الطلبات</span><b>{orders}</b><small>+9 طلب هذا الأسبوع</small></div><div className="kpi"><span>المبيعات المقدرة</span><b>{revenue} ج</b><small>من المحادثات المؤهلة</small></div><div className="kpi"><span>زمن الرد</span><b>8 ث</b><small>متوسط آخر 7 أيام</small></div></div><div className="dashboard-grid"><div className="table-card"><div className="mini-head"><span>المحادثات الأخيرة</span><span className="soft">آخر 24 ساعة</span></div>{conversations.map(c=><div className="conversation" key={c.id}><div className="conv-avatar">{c.initials}</div><div className="conv-main"><b>{c.name}</b><span>{c.text}</span></div><div className="conv-meta"><small>{c.time}</small><i className={c.status==='ساخن'?'hot':''}>{c.status}</i></div></div>)}</div><div className="funnel-card"><div className="mini-head"><span>قمع المبيعات</span><span className="soft">هذا الشهر</span></div><div className="funnel"><div style={{width:'100%'}}><b>128</b><span>محادثة</span></div><div style={{width:'78%'}}><b>100</b><span>مهتم</span></div><div style={{width:'54%'}}><b>69</b><span>مؤهل للشراء</span></div><div style={{width:'32%'}}><b>34</b><span>طلب</span></div></div></div></div></section>}

      <footer><div>FlowSell AI © 2026</div><div>AI sales assistant for growing stores</div></footer>
    </main>
  );
}
