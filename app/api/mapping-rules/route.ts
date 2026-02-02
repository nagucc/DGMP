import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorizedResponse, successResponse } from '@/lib/api-response'
import { mappingRuleSchema } from '@/lib/validations'
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
    const status = searchParams.get('status')

    const where: any = {}

    if (keyword) {
      where.OR = [
        { code: { contains: keyword } },
        { name: { contains: keyword } },
        { sourceSystem: { contains: keyword } },
        { targetSystem: { contains: keyword } }
      ]
    }

    if (status !== null && status !== undefined) {
      where.status = parseInt(status)
    }

    const [rules, total] = await Promise.all([
      prisma.mappingRule.findMany({
        where,
        ...createPaginationParams(page, pageSize, 'createdAt', 'desc'),
        include: {
          fieldMappings: {
            orderBy: {
              sortOrder: 'asc'
            }
          },
          valueMappings: true
        }
      }),
      prisma.mappingRule.count({ where })
    ])

    return successResponse({
      items: rules,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    console.error('Get mapping rules error:', error)
    return NextResponse.json(
      { success: false, error: '获取映射规则列表失败' },
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
    const { fieldMappings, valueMappings, ...ruleData } = body
    const data = mappingRuleSchema.parse(ruleData)

    const existingRule = await prisma.mappingRule.findUnique({
      where: { code: data.code }
    })

    if (existingRule) {
      return NextResponse.json(
        { success: false, error: '映射规则编码已存在' },
        { status: 409 }
      )
    }

    const rule = await prisma.mappingRule.create({
      data: {
        ...data,
        createdBy: authUser.userId,
        fieldMappings: fieldMappings
          ? {
              create: fieldMappings.map((fm: any) => ({
                sourceField: fm.sourceField,
                targetField: fm.targetField,
                transformExpression: fm.transformExpression,
                sortOrder: fm.sortOrder || 0
              }))
            }
          : undefined,
        valueMappings: valueMappings
          ? {
              create: valueMappings.map((vm: any) => ({
                sourceValue: vm.sourceValue,
                targetValue: vm.targetValue,
                description: vm.description
              }))
            }
          : undefined
      },
      include: {
        fieldMappings: {
          orderBy: {
            sortOrder: 'asc'
          }
        },
        valueMappings: true
      }
    })

    return successResponse(rule, '创建映射规则成功')
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
