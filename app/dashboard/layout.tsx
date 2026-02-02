'use client'

import { Layout, Avatar, Dropdown } from 'antd'
import {
  LogoutOutlined,
  UserOutlined
} from '@ant-design/icons';
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth'

const { Header, Content } = Layout

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ]

  return (
    <Layout className="min-h-screen">
      <Layout>
        <Header className="bg-white flex items-center justify-between px-6 shadow-sm">
          <div className="text-lg font-semibold">数据治理管理平台</div>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div className="flex items-center gap-3 cursor-pointer">
              <Avatar icon={<UserOutlined />} />
              <span>{user?.realName || user?.username}</span>
            </div>
          </Dropdown>
        </Header>
        <Content className="p-6 bg-gray-50">
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}
