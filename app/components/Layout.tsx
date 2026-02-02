'use client'

import { useEffect } from 'react';
import { Layout, Breadcrumb, Button, Avatar, Dropdown, message, Menu } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';

const { Header, Content, Footer } = Layout;

interface LayoutProps {
  children: React.ReactNode;
  breadcrumbItems?: Array<{ title: string; href?: string }>;
}

export default function AppLayout({ children, breadcrumbItems = [] }: LayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
      message.success('退出登录成功');
      router.push('/login');
    } catch (error) {
      message.error('退出登录失败');
    }
  };

  // 用户菜单配置
  const menuItems = [
    {
      key: 'profile',
      label: '个人资料',
      icon: <UserOutlined />
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      onClick: handleLogout
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: '#fff', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
          数据治理管理平台 (DGMP)
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {user ? (
            <Dropdown menu={{ items: menuItems }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '8px 16px', borderRadius: '4px' }}>
                <Avatar style={{ marginRight: '8px' }}>{user.username?.[0] || 'U'}</Avatar>
                <span style={{ marginRight: '8px' }}>{user.username}</span>
              </div>
            </Dropdown>
          ) : (
            <Button type="primary">
              <Link href="/login">登录</Link>
            </Button>
          )}
        </div>
      </Header>
      <Layout style={{ padding: '0 24px 24px' }}>
        <div style={{ margin: '16px 0' }}>
          <Breadcrumb>
            {breadcrumbItems.map((item, index) => (
              <Breadcrumb.Item key={index}>
                {item.href ? <Link href={item.href}>{item.title}</Link> : item.title}
              </Breadcrumb.Item>
            ))}
          </Breadcrumb>
        </div>
        <Content
          style={{
            padding: 24,
            margin: 0,
            minHeight: 280,
            background: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          }}
        >
          {children}
        </Content>
      </Layout>
      <Footer style={{ textAlign: 'center', background: '#fff', borderTop: '1px solid #f0f0f0' }}>
        数据治理管理平台 (DGMP) ©{new Date().getFullYear()} Created by DGMP Team
      </Footer>
    </Layout>
  );
}