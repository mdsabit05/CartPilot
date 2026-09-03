import { getProduct, searchProducts } from './products'
import type { CartItem } from '@/types'

export type AgentResult = {
  text: string
  products?: any[]
  comparison?: any[]
  action?: string
  cart?: CartItem[]
}

const money = (n: number) => `₹${n.toLocaleString('en-IN')}`
const OFFER_THRESHOLD = 5000
const OFFER_RATE = 0.10

function cartSubtotal(cart: CartItem[]) {
  return cart.reduce((n, x) => n + x.price * x.quantity, 0)
}

function findOfferAccessory(cart: CartItem[]) {
  // Keep the recommendation relevant to the travel-headphone demo.
  // The catalog is local demo data, so this remains deterministic and explainable.
  const accessory = searchProducts('useful accessory under 500 travel')[0]
  if (!accessory || cart.some(x => x.id === accessory.id)) return undefined
  return accessory
}

export function runDemoAgent(message: string, cart: CartItem[]): AgentResult {
  const m = message.toLowerCase()

  if (m.includes('compare')) {
    const nums = [...m.matchAll(/(?:first|second|third|fourth|1st|2nd|3rd|4th)/g)].map(x => x[0])
    const ids = nums.length
      ? nums.map(n => ({
          first: 'hp-001', second: 'hp-002', third: 'hp-003', fourth: 'hp-004',
          '1st': 'hp-001', '2nd': 'hp-002', '3rd': 'hp-003', '4th': 'hp-004'
        } as Record<string, string>)[n])
      : []
    const ps = ids.map(id => getProduct(id)).filter(Boolean)
    return {
      text: ps.length
        ? `Here’s a focused comparison of ${ps.map(p => p!.name).join(' and ')} based on the catalog data.`
        : 'Tell me which product numbers you want compared (for example, “compare the first and third”).',
      comparison: ps
    }
  }

  // Offer / growth intent is checked before generic "add/cart" handling so
  // "apply the best offer" always invokes the growth logic.
  if (m.includes('offer') || m.includes('discount') || m.includes('coupon')) {
    const subtotal = cartSubtotal(cart)
    const gap = Math.max(0, OFFER_THRESHOLD - subtotal)

    if (!cart.length) {
      return {
        text: 'Your cart is empty. Add a product first and I’ll look for the best available offer.',
        action: 'find_best_offer'
      }
    }

    if (gap === 0) {
      const discount = Math.round(subtotal * OFFER_RATE)
      return {
        text: `Your cart qualifies for the 10% growth offer. That saves ${money(discount)}, bringing your total to ${money(subtotal - discount)}.`,
        action: 'apply_offer',
        cart
      }
    }

    const accessory = findOfferAccessory(cart)
    if (accessory && accessory.price >= gap && accessory.price <= 500) {
      const projectedSubtotal = subtotal + accessory.price
      const projectedDiscount = Math.round(projectedSubtotal * OFFER_RATE)
      return {
        text: `You’re ${money(gap)} away from unlocking 10% off. I found ${accessory.name} for ${money(accessory.price)}. Adding it takes your cart to ${money(projectedSubtotal)} and unlocks an estimated ${money(projectedDiscount)} discount.`,
        products: [accessory],
        action: 'find_best_offer'
      }
    }

    return {
      text: `Your cart is ${money(gap)} away from the current ₹5,000 threshold. I couldn’t find a suitable qualifying accessory within that gap.`,
      action: 'find_best_offer'
    }
  }

  if (m.includes('add') || m.includes('cart')) {
    const p = m.includes('second')
      ? getProduct('hp-002')
      : m.includes('third')
        ? getProduct('hp-003')
        : m.includes('fourth')
          ? getProduct('hp-004')
          : m.includes('first')
            ? getProduct('hp-001')
            : searchProducts(message)[0]

    if (p) {
      const idx = cart.findIndex(x => x.id === p.id)
      const next = [...cart]
      if (idx >= 0) next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 }
      else next.push({ ...p, quantity: 1 })

      const subtotal = cartSubtotal(next)
      const crossed = subtotal >= OFFER_THRESHOLD
      const discount = crossed ? Math.round(subtotal * OFFER_RATE) : 0
      const gap = Math.max(0, OFFER_THRESHOLD - subtotal)

      return {
        text: crossed
          ? `Added ${p.name}. Your cart is now ${money(subtotal)}, so the 10% growth offer is unlocked. You save ${money(discount)} and your estimated total is ${money(subtotal - discount)}.`
          : `Added ${p.name}. Your cart is ${money(gap)} away from unlocking the current 10% offer.`,
        action: `add_to_cart:${p.id}`,
        cart: next
      }
    }
  }

  if (m.includes('remove')) {
    const target = m.includes('second') ? 'hp-002' : m.includes('third') ? 'hp-003' : m.includes('first') ? 'hp-001' : undefined
    const next = target ? cart.filter(x => x.id !== target) : cart.slice(0, -1)
    return { text: 'Removed the requested item from your cart.', action: 'remove_from_cart', cart: next }
  }

  if (m.includes('checkout') || m.includes('buy now') || m.includes('proceed')) {
    return {
      text: 'Your cart is ready. Open Checkout to review the order. Payment is clearly marked as demo unless Razorpay test credentials are configured in the backend.',
      action: 'checkout'
    }
  }

  const found = searchProducts(message)
  if (found.length) {
    return {
      text: `I found ${found.length} strong matches. I ranked them using your budget/category plus catalog relevance, rating and availability.`,
      products: found,
      action: 'search_products'
    }
  }

  return { text: 'Tell me what you want to buy, your budget, and any must-have features. For example: “Find wireless headphones under ₹5,000 with ANC for travel.”' }
}
