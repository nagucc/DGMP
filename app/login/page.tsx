'use client'

import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { useAuthStore } from '@/lib/store/auth'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore((state) => state.setAuth)

  const onFinish = async (values: any) => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      })

      const result = await response.json()

      if (result.success) {
        setAuth(result.data.token, result.data.user)
        message.success('登录成功')
        // 处理重定向逻辑
        const redirect = searchParams.get('redirect')
        if (redirect) {
          router.push(redirect)
        } else {
          router.push('/')
        }
      } else {
        message.error(result.error || '登录失败')
      }
    } catch (error) {
      message.error('登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-600">DGMP</h1>
          <p className="text-gray-500 mt-2">数据治理管理平台</p>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
