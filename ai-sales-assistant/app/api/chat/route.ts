import { NextRequest, NextResponse } from 'next/server';

const fallback = (message: string, products: any[]) => {
  const q = message.toLowerCase();
  const p = products.find(x => q.includes(String(x.name).toLowerCase()) || q.includes(String(x.category).toLowerCase()));
  if (p) {
    if (p.stock <= 0) return `للأسف ${p.name} خلص حاليًا. ممكن أرشح لك بديل مناسب.`;
    return `أيوه ❤️ ${p.name} متاح حاليًا بسعر ${Number(p.price).toLocaleString('ar-EG')} جنيه${p.color ? ` ولونه ${p.color}` : ''}. المتاح ${p.stock} قطعة. تحب أجهز لك الطلب؟`;
  }
  if (/توصيل|شحن/.test(q)) return 'التوصيل داخل القاهرة 60 جنيه، والجيزة 70 جنيه. باقي المحافظات حسب شركة الشحن.';
  if (/أرخص|اقل|أقل/.test(q)) {
    const cheapest = [...products].filter(x => x.active && x.stock > 0).sort((a,b) => a.price-b.price)[0];
    return cheapest ? `أرخص منتج متاح حاليًا هو ${cheapest.name} بسعر ${Number(cheapest.price).toLocaleString('ar-EG')} جنيه.` : 'مش لاقي منتجات متاحة حاليًا.';
  }
  return 'أهلًا 👋 أقدر أساعدك في الأسعار، التوفر، المنتجات والتوصيل. قولي اسم المنتج أو اللي بتدور عليه.';
};

export async function POST(req: NextRequest) {
  try {
    const { message, products = [], history = [] } = await req.json();
    if (!message?.trim()) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ reply: fallback(message, products), mode: 'catalog' });

    const catalog = products.filter((p:any) => p.active !== false).map((p:any) => `${p.name} | ${p.category} | ${p.price} EGP | stock ${p.stock} | ${p.color || ''}`).join('\n');
    const input = [
      { role: 'system', content: `أنت موظف مبيعات FlowSell لمتجر مصري. رد بالمصري بشكل مختصر وودود. لا تخترع سعرًا أو توفرًا؛ استخدم الكتالوج فقط. لو المنتج غير موجود قل ذلك. هدفك مساعدة العميل وإتمام البيع. كتالوج المتجر:\n${catalog}` },
      ...history.slice(-8),
      { role: 'user', content: message },
    ];
    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-5-mini', input }),
    });
    if (!r.ok) return NextResponse.json({ reply: fallback(message, products), mode: 'catalog' });
    const data = await r.json();
    const reply = data.output_text || fallback(message, products);
    return NextResponse.json({ reply, mode: 'ai' });
  } catch {
    return NextResponse.json({ reply: 'حصلت مشكلة بسيطة، جرّب تاني بعد لحظة.', mode: 'error' });
  }
}
