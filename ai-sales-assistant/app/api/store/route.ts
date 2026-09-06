import { NextRequest, NextResponse } from 'next/server';

type Product = { id: string; name: string; category: string; price: number; cost: number; stock: number; color?: string; active: boolean };
type Category = { id: string; name: string };
type Order = { id: string; customer: string; phone: string; address: string; items: { productId: string; name: string; qty: number; price: number }[]; total: number; status: string; createdAt: string };

type StoreData = { products: Product[]; categories: Category[]; orders: Order[] };

const seed: StoreData = {
  categories: [{ id: 'cat-bags', name: 'شنط' }, { id: 'cat-jewelry', name: 'إكسسوارات' }, { id: 'cat-perfume', name: 'عطور' }, { id: 'cat-eyewear', name: 'نظارات' }],
  products: [
    { id: 'p1', name: 'حقيبة Luna Mini', category: 'شنط', price: 890, cost: 540, stock: 7, color: 'أسود', active: true },
    { id: 'p2', name: 'سوار Pearl Twist', category: 'إكسسوارات', price: 420, cost: 210, stock: 18, color: 'ذهبي', active: true },
    { id: 'p3', name: 'عطر Velvet 50ml', category: 'عطور', price: 760, cost: 390, stock: 11, color: '', active: true },
    { id: 'p4', name: 'نظارة Aura', category: 'نظارات', price: 640, cost: 300, stock: 5, color: 'بني', active: true },
  ],
  orders: [],
};

let memory: StoreData = structuredClone(seed);

async function supabase(path: string, init?: RequestInit) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(init?.headers || {}) },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function readData(): Promise<StoreData> {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return memory;
  const [products, categories, orders] = await Promise.all([
    supabase('products?select=*&order=created_at.desc'),
    supabase('categories?select=*&order=name.asc'),
    supabase('orders?select=*&order=created_at.desc'),
  ]);
  return { products: products || [], categories: categories || [], orders: orders || [] };
}

export async function GET() {
  try {
    const data = await readData();
    return NextResponse.json({ ...data, persisted: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Database error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action;

    if (action === 'product') {
      const product: Product = { id: body.id || `p-${Date.now()}`, name: body.name, category: body.category || 'عام', price: Number(body.price), cost: Number(body.cost || 0), stock: Number(body.stock || 0), color: body.color || '', active: body.active !== false };
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        if (body.id) await supabase(`products?id=eq.${encodeURIComponent(body.id)}`, { method: 'PATCH', body: JSON.stringify(product) });
        else await supabase('products', { method: 'POST', body: JSON.stringify({ ...product, id: undefined }) });
      } else {
        const i = memory.products.findIndex(p => p.id === product.id);
        if (i >= 0) memory.products[i] = product; else memory.products.unshift(product);
      }
      return NextResponse.json({ ok: true, product });
    }

    if (action === 'deleteProduct') {
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) await supabase(`products?id=eq.${encodeURIComponent(body.id)}`, { method: 'DELETE' });
      else memory.products = memory.products.filter(p => p.id !== body.id);
      return NextResponse.json({ ok: true });
    }

    if (action === 'category') {
      const category = { id: body.id || `cat-${Date.now()}`, name: body.name };
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        if (body.id) await supabase(`categories?id=eq.${encodeURIComponent(body.id)}`, { method: 'PATCH', body: JSON.stringify(category) });
        else await supabase('categories', { method: 'POST', body: JSON.stringify(category) });
      } else {
        const i = memory.categories.findIndex(c => c.id === category.id);
        if (i >= 0) memory.categories[i] = category; else memory.categories.push(category);
      }
      return NextResponse.json({ ok: true, category });
    }

    if (action === 'order') {
      const order: Order = { id: `ord-${Date.now()}`, customer: body.customer || 'عميل جديد', phone: body.phone || '', address: body.address || '', items: body.items || [], total: Number(body.total || 0), status: 'new', createdAt: new Date().toISOString() };
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        await supabase('orders', { method: 'POST', body: JSON.stringify(order) });
        for (const item of order.items) await supabase(`products?id=eq.${encodeURIComponent(item.productId)}`, { method: 'PATCH', body: JSON.stringify({ stock: Math.max(0, Number(item.stockAfter ?? 0)) }) });
      } else {
        memory.orders.unshift(order);
        for (const item of order.items) {
          const p = memory.products.find(x => x.id === item.productId);
          if (p) p.stock = Math.max(0, p.stock - Number(item.qty || 0));
        }
      }
      return NextResponse.json({ ok: true, order });
    }

    if (action === 'orderStatus') {
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) await supabase(`orders?id=eq.${encodeURIComponent(body.id)}`, { method: 'PATCH', body: JSON.stringify({ status: body.status }) });
      else { const o = memory.orders.find(x => x.id === body.id); if (o) o.status = body.status; }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Request failed' }, { status: 500 });
  }
}
