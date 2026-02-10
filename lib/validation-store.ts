// Validation Request Store - Shared state between Requester and BU personas
// Uses localStorage to persist data across page navigations and refreshes

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
  // Context for Values (parent characteristic and model)
  contextCharacteristic?: string
  contextModel?: string
}

export interface ValidationRequest {
  id: string
  requesterId: string
  status: RequestStatus
  createdAt: string // ISO string for JSON serialization
  submittedAt?: string
  completedAt?: string
  buComment?: string // Comment from BU at the request level
  items: TranslationItem[]
}

const STORAGE_KEY = 'validation_requests'

// Get validation requests from localStorage
function getValidationRequestsFromStorage(): ValidationRequest[] {
  if (typeof window === 'undefined') return []
  
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('[v0] Error reading validation requests from storage:', error)
    return []
  }
}

// Save validation requests to localStorage
function saveValidationRequestsToStorage(requests: ValidationRequest[]): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests))
  } catch (error) {
    console.error('[v0] Error saving validation requests to storage:', error)
  }
}

// Generate unique ID
export function generateId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Get all requests
export function getAllRequests(): ValidationRequest[] {
  return getValidationRequestsFromStorage()
}

// Get requests by status
export function getRequestsByStatus(status: RequestStatus): ValidationRequest[] {
  return getValidationRequestsFromStorage().filter(req => req.status === status)
}

// Get pending requests for BU (pending or in_review)
export function getPendingRequestsForBU(): ValidationRequest[] {
  return getValidationRequestsFromStorage().filter(req => 
    req.status === 'pending' || req.status === 'in_review'
  )
}

// Get completed requests for Requester
export function getCompletedRequests(): ValidationRequest[] {
  return getValidationRequestsFromStorage().filter(req => req.status === 'completed')
}

// Get draft request for current requester (there should only be one active draft)
export function getDraftRequest(): ValidationRequest | undefined {
  return getValidationRequestsFromStorage().find(req => req.status === 'draft')
}

// Create a new draft request
export function createDraftRequest(): ValidationRequest {
  const requests = getValidationRequestsFromStorage()
  const existingDraft = requests.find(req => req.status === 'draft')
  if (existingDraft) return existingDraft
  
  const newRequest: ValidationRequest = {
    id: generateId(),
    requesterId: 'requester_1', // For demo, we use a fixed requester
    status: 'draft',
    createdAt: new Date().toISOString(),
    items: []
  }
  
  requests.push(newRequest)
  saveValidationRequestsToStorage(requests)
  return newRequest
}

// Add item to draft request
export function addItemToDraft(item: Omit<TranslationItem, 'id' | 'status'>): TranslationItem {
  const requests = getValidationRequestsFromStorage()
  let draft = requests.find(req => req.status === 'draft')
  
  if (!draft) {
    draft = {
      id: generateId(),
      requesterId: 'requester_1',
      status: 'draft',
      createdAt: new Date().toISOString(),
      items: []
    }
    requests.push(draft)
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
  
  saveValidationRequestsToStorage(requests)
  return newItem
}

// Remove item from draft
export function removeItemFromDraft(itemId: string): void {
  const requests = getValidationRequestsFromStorage()
  const draft = requests.find(req => req.status === 'draft')
  if (!draft) return
  
  draft.items = draft.items.filter(item => item.itemId !== itemId)
  saveValidationRequestsToStorage(requests)
}

// Update item in draft
export function updateItemInDraft(itemId: string, updates: Partial<TranslationItem>): void {
  const requests = getValidationRequestsFromStorage()
  const draft = requests.find(req => req.status === 'draft')
  if (!draft) return
  
  const itemIndex = draft.items.findIndex(item => item.itemId === itemId)
  if (itemIndex >= 0) {
    draft.items[itemIndex] = { ...draft.items[itemIndex], ...updates }
  }
  
  saveValidationRequestsToStorage(requests)
}

// Submit draft request for validation
export function submitDraftRequest(): ValidationRequest | null {
  const requests = getValidationRequestsFromStorage()
  const draft = requests.find(req => req.status === 'draft')
  if (!draft || draft.items.length === 0) return null
  
  draft.status = 'pending'
  draft.submittedAt = new Date().toISOString()
  
  saveValidationRequestsToStorage(requests)
  return draft
}

// Get request by ID
export function getRequestById(id: string): ValidationRequest | undefined {
  return getValidationRequestsFromStorage().find(req => req.id === id)
}

// BU: Start reviewing a request
export function startReviewingRequest(requestId: string): ValidationRequest | null {
  const requests = getValidationRequestsFromStorage()
  const request = requests.find(req => req.id === requestId)
  if (!request || request.status !== 'pending') return null
  
  request.status = 'in_review'
  saveValidationRequestsToStorage(requests)
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
  const requests = getValidationRequestsFromStorage()
  const request = requests.find(req => req.id === requestId)
  if (!request) return
  
  const item = request.items.find(i => i.id === itemId)
  if (!item) return
  
  item.finalNameFr = finalNameFr
  item.finalDescriptionFr = finalDescriptionFr
  item.status = status
  
  saveValidationRequestsToStorage(requests)
}

// BU: Complete the request
export function completeRequest(requestId: string, comment?: string): ValidationRequest | null {
  const requests = getValidationRequestsFromStorage()
  const request = requests.find(req => req.id === requestId)
  if (!request) return null
  
  // Check if all items have been processed
  const allProcessed = request.items.every(item => 
    item.status !== 'pending' && item.finalNameFr !== undefined
  )
  
  if (!allProcessed) return null
  
  request.status = 'completed'
  request.completedAt = new Date().toISOString()
  if (comment) {
    request.buComment = comment
  }
  
  saveValidationRequestsToStorage(requests)
  return request
}

// Clear draft (for testing/demo purposes)
export function clearDraft(): void {
  const requests = getValidationRequestsFromStorage()
  const filtered = requests.filter(req => req.status !== 'draft')
  saveValidationRequestsToStorage(filtered)
}

// Reset all data (for testing/demo purposes)
export function resetAllData(): void {
  saveValidationRequestsToStorage([])
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
