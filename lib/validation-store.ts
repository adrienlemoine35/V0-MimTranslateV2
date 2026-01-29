// Validation Request Store - Shared state between Requester and BU personas
// For demo purposes, we use a simple in-memory store that persists during the session

export type RequestStatus = 'draft' | 'pending' | 'in_review' | 'completed'
export type ItemStatus = 'pending' | 'approved' | 'modified' | 'rejected'

export interface TranslationItem {
  id: string
  itemId: string // Reference to the product/characteristic/value ID
  itemType: 'Rayon' | 'Sous-Rayon' | 'Regroupement' | 'Modèle' | 'Caractéristique' | 'Valeur'
  nameEn: string
  descriptionEn: string
  originalNameFr: string
  originalDescriptionFr: string
  proposedNameFr: string
  proposedDescriptionFr: string
  finalNameFr?: string
  finalDescriptionFr?: string
  status: ItemStatus
}

export interface ValidationRequest {
  id: string
  requesterId: string
  status: RequestStatus
  createdAt: Date
  submittedAt?: Date
  completedAt?: Date
  buComment?: string // Comment from BU at the request level
  items: TranslationItem[]
}

// In-memory store for demo
let validationRequests: ValidationRequest[] = []

// Generate unique ID
export function generateId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Get all requests
export function getAllRequests(): ValidationRequest[] {
  return validationRequests
}

// Get requests by status
export function getRequestsByStatus(status: RequestStatus): ValidationRequest[] {
  return validationRequests.filter(req => req.status === status)
}

// Get pending requests for BU (pending or in_review)
export function getPendingRequestsForBU(): ValidationRequest[] {
  return validationRequests.filter(req => 
    req.status === 'pending' || req.status === 'in_review'
  )
}

// Get completed requests for Requester
export function getCompletedRequests(): ValidationRequest[] {
  return validationRequests.filter(req => req.status === 'completed')
}

// Get draft request for current requester (there should only be one active draft)
export function getDraftRequest(): ValidationRequest | undefined {
  return validationRequests.find(req => req.status === 'draft')
}

// Create a new draft request
export function createDraftRequest(): ValidationRequest {
  const existingDraft = getDraftRequest()
  if (existingDraft) return existingDraft
  
  const newRequest: ValidationRequest = {
    id: generateId(),
    requesterId: 'requester_1', // For demo, we use a fixed requester
    status: 'draft',
    createdAt: new Date(),
    items: []
  }
  
  validationRequests.push(newRequest)
  return newRequest
}

// Add item to draft request
export function addItemToDraft(item: Omit<TranslationItem, 'id' | 'status'>): TranslationItem {
  let draft = getDraftRequest()
  if (!draft) {
    draft = createDraftRequest()
  }
  
  // Check if item already exists in draft
  const existingIndex = draft.items.findIndex(i => i.itemId === item.itemId)
  
  const newItem: TranslationItem = {
    ...item,
    id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: 'pending'
  }
  
  if (existingIndex >= 0) {
    // Update existing item
    draft.items[existingIndex] = { ...draft.items[existingIndex], ...newItem, id: draft.items[existingIndex].id }
  } else {
    // Add new item
    draft.items.push(newItem)
  }
  
  return newItem
}

// Remove item from draft
export function removeItemFromDraft(itemId: string): void {
  const draft = getDraftRequest()
  if (!draft) return
  
  draft.items = draft.items.filter(item => item.itemId !== itemId)
}

// Update item in draft
export function updateItemInDraft(itemId: string, updates: Partial<TranslationItem>): void {
  const draft = getDraftRequest()
  if (!draft) return
  
  const itemIndex = draft.items.findIndex(item => item.itemId === itemId)
  if (itemIndex >= 0) {
    draft.items[itemIndex] = { ...draft.items[itemIndex], ...updates }
  }
}

// Submit draft request for validation
export function submitDraftRequest(): ValidationRequest | null {
  const draft = getDraftRequest()
  if (!draft || draft.items.length === 0) return null
  
  draft.status = 'pending'
  draft.submittedAt = new Date()
  
  return draft
}

// Get request by ID
export function getRequestById(id: string): ValidationRequest | undefined {
  return validationRequests.find(req => req.id === id)
}

// BU: Start reviewing a request
export function startReviewingRequest(requestId: string): ValidationRequest | null {
  const request = getRequestById(requestId)
  if (!request || request.status !== 'pending') return null
  
  request.status = 'in_review'
  return request
}

// BU: Update item status and final values
export function updateItemByBU(
  requestId: string, 
  itemId: string, 
  finalNameFr: string,
  finalDescriptionFr: string,
  status: ItemStatus
): void {
  const request = getRequestById(requestId)
  if (!request) return
  
  const item = request.items.find(i => i.id === itemId)
  if (!item) return
  
  item.finalNameFr = finalNameFr
  item.finalDescriptionFr = finalDescriptionFr
  item.status = status
}

// BU: Complete the request
export function completeRequest(requestId: string, comment?: string): ValidationRequest | null {
  const request = getRequestById(requestId)
  if (!request) return null
  
  // Check if all items have been processed
  const allProcessed = request.items.every(item => 
    item.status !== 'pending' && item.finalNameFr !== undefined
  )
  
  if (!allProcessed) return null
  
  request.status = 'completed'
  request.completedAt = new Date()
  if (comment) {
    request.buComment = comment
  }
  
  return request
}

// Clear draft (for testing/demo purposes)
export function clearDraft(): void {
  validationRequests = validationRequests.filter(req => req.status !== 'draft')
}

// Reset all data (for testing/demo purposes)
export function resetAllData(): void {
  validationRequests = []
}

// Get count of items in current draft
export function getDraftItemCount(): number {
  const draft = getDraftRequest()
  return draft?.items.length ?? 0
}

// Check if an item is in the draft
export function isItemInDraft(itemId: string): boolean {
  const draft = getDraftRequest()
  if (!draft) return false
  return draft.items.some(item => item.itemId === itemId)
}
