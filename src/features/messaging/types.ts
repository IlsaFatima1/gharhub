export type MessageKind = 'text' | 'image'
export type DeliveryState = 'sending' | 'sent' | 'read' | 'failed'
export type ChatParticipant = { id:string; name:string; avatar:string; role:'buyer'|'seller'; online:boolean; lastSeen:string }
export type Conversation = { id:string; propertyId:string; propertyTitle:string; propertyImage:string; participants:ChatParticipant[]; lastMessage:string; lastMessageAt:string; unreadCount:number }
export type ChatMessage = { id:string; conversationId:string; senderId:string; body:string; imageUrl:string|null; kind:MessageKind; createdAt:string; readAt:string|null; state:DeliveryState }
export type MessagingSnapshot = { conversations:Conversation[]; messages:Record<string,ChatMessage[]> }
