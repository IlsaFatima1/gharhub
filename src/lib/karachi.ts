export const KARACHI_CITY='Karachi' as const
export const KARACHI_AREAS=['Bahadurabad','Buffer Zone','Clifton','Defence View','DHA','Federal B Area','Garden','Gulistan-e-Johar','Gulshan-e-Iqbal','Karsaz','Keamari','Korangi','Landhi','Liaquatabad','Malir','Nazimabad','North Karachi','North Nazimabad','PECHS','Saddar','Scheme 33','Shah Faisal Colony'] as const
export type KarachiArea=typeof KARACHI_AREAS[number]
export const KARACHI_CENTER={lat:24.8607,lng:67.0011}
export const KARACHI_BOUNDS={north:25.55,south:24.45,east:67.65,west:66.55}
export function isInKarachi(lat:number,lng:number){return lat>=KARACHI_BOUNDS.south&&lat<=KARACHI_BOUNDS.north&&lng>=KARACHI_BOUNDS.west&&lng<=KARACHI_BOUNDS.east}