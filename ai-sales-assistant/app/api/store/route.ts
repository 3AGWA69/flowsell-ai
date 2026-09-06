import { NextRequest, NextResponse } from 'next/server';

type Product = {
  id: string;
  name: string;
  description?: string;
  category: string;
  categoryId?: string;
  sku?: string;
  imageUrl?: string;
  price: number;
  cost: number;
  stock: number;
  lowStockThreshold: number;
  color?: string;
  active: boolean;
};
type Category = { id: string; name: string; description?: string };
type Order = { id: string; customer: string; phone: string; address: string; items: any[]; total: number; status: string; createdAt: string };
type StoreData = { products: Product[]; categories: Category[]; orders: Order[] };

const memory: StoreData = { products: [], categories: [], orders: [] };
const url = () => process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = () => process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const db = () => Boolean(url() && key());

async function supabase(path: string, init?: RequestInit) {
  if (!db()) return null;
  const res = await fetch(`${url()}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key()!,
      Authorization: `Bearer ${key()}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await res.text());
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

function normalizeProduct(p: any): Product {
  return {
    id: p.id,
    name: p.name || '',
    description: p.description || '',
    category: p.category_name || p.category?.name || p.category || 'عام',
    categoryId: p.category_id,
    sku: p.sku || '',
    imageUrl: p.image_url || '',
    price: Number(p.sale_price ?? p.price ?? 0),
    cost: Number(p.purchase_price ?? p.cost ?? 0),
    stock: Number(p.stock_quantity ?? p.stock ?? 0),
    lowStockThreshold: Number(p.low_stock_threshold ?? 3),
    color: p.color || '',
    active: p.is_active ?? p.active ?? true,
  };
}

function normalizeOrder(o: any): Order {
  return {
    id: o.id,
    customer: o.customer || o.customer_name || 'عميل جديد',
    phone: o.phone || '',
    address: o.address || '',
    items: o.items || [],
    total: Number(o.total || 0),
    status: o.status || 'new',
    createdAt: o.created_at || o.createdAt || new Date().toISOString(),
  };
}

async function readData(): Promise<StoreData> {
  if (!db()) return structuredClone(memory);
  const [rawProducts, rawCategories, rawOrders] = await Promise.all([
    supabase('products?select=*&order=created_at.desc'),
    supabase('categories?select=*&order=name.asc'),
    supabase('orders?select=*&order=created_at.desc'),
  ]);
  const categories = (rawCategories || []).map((c: any) => ({ id: c.id, name: c.name, description: c.description || '' }));
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));
  const products = (rawProducts || []).map((p: any) => normalizeProduct({ ...p, category_name: categoryMap.get(p.category_id) }));
  return { products, categories, orders: (rawOrders || []).map(normalizeOrder) };
}

export async function GET() {
  try {
    return NextResponse.json({ ...(await readData()), persisted: db() });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Database error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action;

    if (action === 'product') {
      const payload = {
        name: String(body.name || '').trim(),
        description: body.description || '',
        category_id: body.categoryId || null,
        sku: body.sku || null,
        image_url: body.imageUrl || null,
        purchase_price: Number(body.cost || 0),
        sale_price: Number(body.price || 0),
        stock_quantity: Number(body.stock || 0),
        low_stock_threshold: Number(body.lowStockThreshold ?? 3),
        is_active: body.active !== false,
      };
      if (!payload.name) return NextResponse.json({ error: 'اسم المنتج مطلوب' }, { status: 400 });
      if (db()) {
        const result = body.id
          ? await supabase(`products?id=eq.${encodeURIComponent(body.id)}`, { method: 'PATCH', body: JSON.stringify(payload) })
          : await supabase('products', { method: 'POST', body: JSON.stringify(payload) });
        return NextResponse.json({ ok: true, product: result?.[0] || null });
      }
      const p: Product = { id: body.id || `p-${Date.now()}`, name: payload.name, description: payload.description, category: body.category || 'عام', categoryId: body.categoryId, sku: payload.sku || '', imageUrl: payload.image_url || '', price: payload.sale_price, cost: payload.purchase_price, stock: payload.stock_quantity, lowStockThreshold: payload.low_stock_threshold, active: payload.is_active };
      const i = memory.products.findIndex(x => x.id === p.id);
      if (i >= 0) memory.products[i] = p; else memory.products.unshift(p);
      return NextResponse.json({ ok: true, product: p });
    }

    if (action === 'deleteProduct') {
      if (db()) await supabase(`products?id=eq.${encodeURIComponent(body.id)}`, { method: 'DELETE' });
      else memory.products.splice(memory.products.findIndex(p => p.id === body.id), 1);
      return NextResponse.json({ ok: true });
    }

    if (action === 'category') {
      const payload = { name: String(body.name || '').trim(), description: body.description || '' };
      if (!payload.name) return NextResponse.json({ error: 'اسم التصنيف مطلوب' }, { status: 400 });
      if (db()) {
        const result = body.id
          ? await supabase(`categories?id=eq.${encodeURIComponent(body.id)}`, { method: 'PATCH', body: JSON.stringify(payload) })
          : await supabase('categories', { method: 'POST', body: JSON.stringify(payload) });
        return NextResponse.json({ ok: true, category: result?.[0] || null });
      }
      const c = { id: body.id || `cat-${Date.now()}`, ...payload };
      const i = memory.categories.findIndex(x => x.id === c.id);
      if (i >= 0) memory.categories[i] = c; else memory.categories.push(c);
      return NextResponse.json({ ok: true, category: c });
    }

    if (action === 'deleteCategory') {
      if (db()) await supabase(`categories?id=eq.${encodeURIComponent(body.id)}`, { method: 'DELETE' });
      else memory.categories.splice(memory.categories.findIndex(c => c.id === body.id), 1);
      return NextResponse.json({ ok: true });
    }

    if (action === 'order') {
      const payload = { customer: body.customer || 'عميل جديد', phone: body.phone || '', address: body.address || '', items: body.items || [], total: Number(body.total || 0), status: 'new' };
      if (db()) {
        const created = await supabase('orders', { method: 'POST', body: JSON.stringify(payload) });
        return NextResponse.json({ ok: true, order: normalizeOrder(created?.[0] || payload) });
      }
      const order = { ...payload, id: `ord-${Date.now()}`, created_at: new Date().toISOString() };
      memory.orders.unshift(normalizeOrder(order));
      for (const item of order.items) {
        const p = memory.products.find(x => x.id === item.productId);
        if (p) p.stock = Math.max(0, p.stock - Number(item.qty || 0));
      }
      return NextResponse.json({ ok: true, order: normalizeOrder(order) });
    }

    if (action === 'orderStatus') {
      if (db()) await supabase(`orders?id=eq.${encodeURIComponent(body.id)}`, { method: 'PATCH', body: JSON.stringify({ status: body.status }) });
      else { const o = memory.orders.find(x => x.id === body.id); if (o) o.status = body.status; }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Request failed' }, { status: 500 });
  }
}
