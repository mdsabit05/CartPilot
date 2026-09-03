import { NextResponse } from 'next/server'
import crypto from 'node:crypto'

export async function POST(req: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json()
    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret) return NextResponse.json({ error: 'Razorpay test secret is not configured.' }, { status: 503 })
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Incomplete payment verification payload.' }, { status: 400 })
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex')
    const valid = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature))

    if (!valid) return NextResponse.json({ verified: false, error: 'Payment signature verification failed.' }, { status: 400 })
    return NextResponse.json({ verified: true, paymentId: razorpay_payment_id, orderId: razorpay_order_id })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Verification failed.' }, { status: 500 })
  }
}
