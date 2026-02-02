'use client'

import { usePathname } from 'next/navigation';
import AuthGuard from './AuthGuard';
import AppLayout from './Layout';

interface LayoutContentProps {
  children: React.ReactNode;
}

export default function LayoutContent({ children }: LayoutContentProps) {
  const pathname = usePathname();
  
  // 不需要布局的页面
  const noLayoutPaths = ['/login', '/register'];
  
  // 检查是否为不需要布局的页面
  if (noLayoutPaths.includes(pathname)) {
    return children;
  }
  
  // 其他页面使用统一布局和认证保护
  return (
    <AuthGuard>
      <AppLayout>
        {children}
      </AppLayout>
    </AuthGuard>
  );
}
