import { NextResponse } from 'next/server'
import { getProduct } from '@/lib/products'

export async function POST(req: Request) {
  try {
    const { items } = await req.json()
    const safeItems = Array.isArray(items) ? items : []
    if (!safeItems.length) return NextResponse.json({ error: 'Cart is empty.' }, { status: 400 })

    let subtotal = 0
    for (const item of safeItems) {
      const product = getProduct(String(item?.id || ''))
      const quantity = Math.floor(Number(item?.quantity || 0))
      if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > product.stock) {
        return NextResponse.json({ error: 'Invalid cart item or quantity.' }, { status: 400 })
      }
      subtotal += product.price * quantity
    }
    const discount = subtotal >= 5000 ? Math.round(subtotal * 0.10) : 0
    const paise = Math.round((subtotal - discount) * 100)
    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
      return NextResponse.json({ demo: true, message: 'Razorpay test credentials are not configured.' })
    }
    if (!Number.isFinite(paise) || paise <= 0) {
      return NextResponse.json({ error: 'Invalid payment amount.' }, { status: 400 })
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64')
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: paise,
        currency: 'INR',
        receipt: `cartpilot_${Date.now()}`,
        notes: { source: 'CartPilot Buildathon MVP' }
      })
    })

    const data = await response.json()
    if (!response.ok) return NextResponse.json({ error: data?.error?.description || 'Razorpay order creation failed.' }, { status: response.status })

    return NextResponse.json({ orderId: data.id, keyId, amount: data.amount, currency: data.currency })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Payment setup failed.' }, { status: 500 })
  }
}
