export type BookStatus = 'allowed' | 'restricted' | 'contract-needed' | 'not-allowed'

export type BookResult = {
  title: string
  author: string
  publisher: string
  pubdate: string
  isbn: string
  price: string
  image: string
  publisherType: 'allowed' | 'restricted' | 'contract-check' | 'not-allowed'
  contractStatus?: 'ALLOWED' | 'DENIED' | 'EXPIRED' | 'NOT_FOUND'
  status: BookStatus
  message: string
}

export type SearchResponse = {
  success: boolean
  query?: string
  totalResults?: number
  results?: BookResult[]
  filteredCount?: number
  message?: string
  error?: string
}

export async function searchBooks(query: string, signal?: AbortSignal): Promise<SearchResponse> {
  const res = await fetch(`/api/naver-book-search?query=${encodeURIComponent(query)}`, { signal })
  return res.json()
}
