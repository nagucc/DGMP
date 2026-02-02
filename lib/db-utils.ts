import { Prisma } from '@prisma/client'

export function handlePrismaError(error: any): { message: string; status: number } {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return {
          message: '数据已存在，请勿重复创建',
          status: 409
        }
      case 'P2025':
        return {
          message: '记录不存在',
          status: 404
        }
      case 'P2003':
        return {
          message: '关联数据不存在',
          status: 400
        }
      default:
        return {
          message: '数据库操作失败',
          status: 500
        }
    }
  }
  
  if (error instanceof Prisma.PrismaClientValidationError) {
    return {
      message: '数据验证失败',
      status: 400
    }
  }

  return {
    message: '服务器内部错误',
    status: 500
  }
}

export function calculatePagination(page: number = 1, pageSize: number = 10) {
  const skip = (page - 1) * pageSize
  const take = pageSize
  return { skip, take }
}

export function createPaginationParams<T extends Prisma.FindManyArgs>(
  page: number = 1,
  pageSize: number = 10,
  sortBy?: string,
  sortOrder: 'asc' | 'desc' = 'desc'
): T {
  const { skip, take } = calculatePagination(page, pageSize)
  
  const params: any = {
    skip,
    take
  }

  if (sortBy) {
    params.orderBy = {
      [sortBy]: sortOrder
    }
  }

  return params as T
}
