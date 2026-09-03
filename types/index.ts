export type Product = {
  id:string; name:string; brand:string; category:string; price:number; originalPrice:number; discount:number; rating:number; reviewCount:number; description:string; specifications:Record<string,string>; features:string[]; stock:number; image:string; tags:string[]
}
export type CartItem = Product & { quantity:number }
export type CartState = { items:CartItem[]; subtotal:number; discount:number; total:number; offer?:string }
