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
      if (!Number.isFinite(payload.sale_price) || payload.sale_price < 0) return NextResponse.json({ error: 'سعر البيع غير صحيح' }, { status: 400 });
      if (!Number.isFinite(payload.purchase_price) || payload.purchase_price < 0) return NextResponse.json({ error: 'سعر الشراء غير صحيح' }, { status: 400 });
      if (!Number.isInteger(payload.stock_quantity) || payload.stock_quantity < 0) return NextResponse.json({ error: 'المخزون غير صحيح' }, { status: 400 });
      if (!Number.isInteger(payload.low_stock_threshold) || payload.low_stock_threshold < 0) return NextResponse.json({ error: 'حد المخزون المنخفض غير صحيح' }, { status: 400 });
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
      if (!body.id) return NextResponse.json({ error: 'معرّف المنتج مطلوب' }, { status: 400 });
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
      if (!body.id) return NextResponse.json({ error: 'معرّف التصنيف مطلوب' }, { status: 400 });
      if (db()) {
        const linked = await supabase(`products?select=id&category_id=eq.${encodeURIComponent(body.id)}&limit=1`);
        if ((linked || []).length) return NextResponse.json({ error: 'لا يمكن حذف تصنيف مستخدم لمنتجات. انقل المنتجات لتصنيف آخر أولًا.' }, { status: 409 });
        await supabase(`categories?id=eq.${encodeURIComponent(body.id)}`, { method: 'DELETE' });
      } else {
        if (memory.products.some(p => p.categoryId === body.id)) return NextResponse.json({ error: 'لا يمكن حذف تصنيف مستخدم لمنتجات.' }, { status: 409 });
        memory.categories.splice(memory.categories.findIndex(c => c.id === body.id), 1);
      }
      return NextResponse.json({ ok: true });
    }

    if (action === 'order') {
      const rawItems = Array.isArray(body.items) ? body.items : [];
      const customer = String(body.customer || 'عميل جديد').trim();
      const phone = String(body.phone || '').trim();
      const address = String(body.address || '').trim();
      if (!customer || !phone || !address || !rawItems.length) return NextResponse.json({ error: 'بيانات الطلب غير مكتملة' }, { status: 400 });

      // Never trust client-side prices, totals, names, or stock. Rebuild the order from the database.
      const quantities = new Map<string, number>();
      for (const item of rawItems) {
        const productId = String(item?.productId || '').trim();
        const qty = Number(item?.qty || 0);
        if (!productId || !Number.isInteger(qty) || qty < 1) return NextResponse.json({ error: 'بيانات أحد المنتجات غير صحيحة.' }, { status: 400 });
        quantities.set(productId, (quantities.get(productId) || 0) + qty);
      }

      if (db()) {
        const ids = [...quantities.keys()];
        const rows = await supabase(`products?select=id,name,sale_price,stock_quantity,is_active&id=in.(${ids.map(encodeURIComponent).join(',')})`);
        const byId = new Map((rows || []).map((p: any) => [String(p.id), p]));
        const serverItems: Array<{ productId: string; name: string; price: number; qty: number }> = [];
        let computedTotal = 0;

        for (const [productId, qty] of quantities) {
          const p = byId.get(productId);
          if (!p || p.is_active === false) return NextResponse.json({ error: 'أحد المنتجات لم يعد متاحًا.' }, { status: 409 });
          const price = Number(p.sale_price);
          const stock = Number(p.stock_quantity);
          if (!Number.isFinite(price) || price < 0) return NextResponse.json({ error: `سعر المنتج ${p.name} غير صحيح.` }, { status: 409 });
          if (stock < qty) return NextResponse.json({ error: `المخزون غير كافٍ للمنتج ${p.name}. المتاح ${stock} قطعة.` }, { status: 409 });
          serverItems.push({ productId, name: p.name, price, qty });
          computedTotal += price * qty;
        }

        const orderPayload = { customer, phone, address, items: serverItems, total: Number(computedTotal.toFixed(2)), status: 'new' };
        const created = await supabase('orders', { method: 'POST', body: JSON.stringify(orderPayload) });
        const changed: Array<{ id: string; previousStock: number }> = [];

        try {
          for (const item of serverItems) {
            const p = byId.get(item.productId)!;
            const previousStock = Number(p.stock_quantity);
            const result = await supabase(`products?id=eq.${encodeURIComponent(item.productId)}&stock_quantity=gte.${item.qty}`, {
              method: 'PATCH',
              body: JSON.stringify({ stock_quantity: previousStock - item.qty }),
            });
            if (!result?.length) throw new Error(`Stock update rejected for ${item.productId}`);
            changed.push({ id: item.productId, previousStock });
          }
        } catch (stockError) {
          for (const item of changed.reverse()) {
            try {
              await supabase(`products?id=eq.${encodeURIComponent(item.id)}`, { method: 'PATCH', body: JSON.stringify({ stock_quantity: item.previousStock }) });
            } catch (rollbackError) {
              console.error('Stock rollback failed', rollbackError);
            }
          }
          if (created?.[0]?.id) {
            try { await supabase(`orders?id=eq.${encodeURIComponent(created[0].id)}`, { method: 'DELETE' }); } catch (deleteError) { console.error('Order rollback failed', deleteError); }
          }
          console.error('Order stock transaction failed', stockError);
          return NextResponse.json({ error: 'تعذر تأكيد المخزون. لم يتم تسجيل الطلب.' }, { status: 409 });
        }

        return NextResponse.json({ ok: true, order: normalizeOrder(created?.[0] || orderPayload) });
      }

      const serverItems = rawItems.map((item: any) => {
        const p = memory.products.find(x => x.id === String(item.productId));
        if (!p || !p.active) throw new Error('المنتج غير متاح');
        const qty = quantities.get(p.id) || 0;
        if (p.stock < qty) throw new Error(`المخزون غير كافٍ للمنتج ${p.name}`);
        return { productId: p.id, name: p.name, price: p.price, qty };
      }).filter((item: any, index: number, arr: any[]) => arr.findIndex(x => x.productId === item.productId) === index);
      const computedTotal = serverItems.reduce((sum: number, item: any) => sum + item.price * item.qty, 0);
      const order = { customer, phone, address, items: serverItems, total: Number(computedTotal.toFixed(2)), status: 'new', id: `ord-${Date.now()}`, created_at: new Date().toISOString() };
      memory.orders.unshift(normalizeOrder(order));
      for (const item of serverItems) {
        const p = memory.products.find(x => x.id === item.productId);
        if (p) p.stock -= item.qty;
      }
      return NextResponse.json({ ok: true, order: normalizeOrder(order) });
    }

    if (action === 'orderStatus') {
      const allowed = new Set(['new', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']);
      if (!body.id || !allowed.has(String(body.status))) return NextResponse.json({ error: 'حالة الطلب غير صحيحة' }, { status: 400 });
      if (db()) await supabase(`orders?id=eq.${encodeURIComponent(body.id)}`, { method: 'PATCH', body: JSON.stringify({ status: body.status }) });
      else { const o = memory.orders.find(x => x.id === body.id); if (o) o.status = body.status; }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    console.error('Store API error', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Request failed' }, { status: 500 });
  }
}
