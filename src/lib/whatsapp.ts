export function waNumber(raw:string){const digits=raw.replace(/[^\d]/g,'');if(!digits)return'';if(digits.startsWith('0'))return'92'+digits.slice(1);if(digits.startsWith('92'))return digits;if(digits.startsWith('+92'))return digits.slice(1);if(digits.startsWith('0092'))return digits.slice(2);return digits}
export function waLink(phone:string,text:string){const number=waNumber(phone);if(!number)return null;return`https://wa.me/${number}?text=${encodeURIComponent(text)}`}
export const WA_COLOR='#25D366'
