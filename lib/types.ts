export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginationParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginationResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface User {
  id: bigint
  username: string
  email?: string | null
  realName?: string | null
  avatar?: string | null
  status: number
  roles?: Role[]
}

export interface Role {
  id: bigint
  code: string
  name: string
  description?: string | null
  status: number
}

export interface Permission {
  id: bigint
  code: string
  name: string
  module: string
  action: string
  description?: string | null
}

export interface JwtPayload {
  userId: string
  username: string
  roles: string[]
}
