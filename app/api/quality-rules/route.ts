import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorizedResponse, successResponse } from '@/lib/api-response'
import { qualityRuleSchema } from '@/lib/validations'
import { handlePrismaError, createPaginationParams } from '@/lib/db-utils'

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const keyword = searchParams.get('keyword') || ''
    const ruleType = searchParams.get('ruleType')
    const status = searchParams.get('status')

    const where: any = {}

    if (keyword) {
      where.OR = [
        { code: { contains: keyword } },
        { name: { contains: keyword } }
      ]
    }

    if (ruleType) {
      where.ruleType = ruleType
    }

    if (status !== null && status !== undefined) {
      where.status = parseInt(status)
    }

    const [rules, total] = await Promise.all([
      prisma.qualityRule.findMany({
        where,
        ...createPaginationParams(page, pageSize, 'createdAt', 'desc'),
        include: {
          category: true
        }
      }),
      prisma.qualityRule.count({ where })
    ])

    return successResponse({
      items: rules,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    console.error('Get quality rules error:', error)
    return NextResponse.json(
      { success: false, error: '获取质量规则列表失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const data = qualityRuleSchema.parse(body)

    const existingRule = await prisma.qualityRule.findUnique({
      where: { code: data.code }
    })

    if (existingRule) {
      return NextResponse.json(
        { success: false, error: '质量规则编码已存在' },
        { status: 409 }
      )
    }

    const rule = await prisma.qualityRule.create({
      data: {
        ...data,
        createdBy: authUser.userId
      },
      include: {
        category: true
      }
    })

    return successResponse(rule, '创建质量规则成功')
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }

    const { message, status } = handlePrismaError(error)
    return NextResponse.json(
      { success: false, error: message },
      { status }
    )
  }
}
