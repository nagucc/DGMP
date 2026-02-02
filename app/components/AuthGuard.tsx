'use client'

import { useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export default function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, token } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 模拟一个短暂的加载时间，确保状态从localStorage中恢复
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // 不需要认证的页面
    const publicPaths = ['/login', '/register'];
    if (publicPaths.includes(pathname)) {
      return;
    }

    // 加载完成后再检查认证状态
    if (!isLoading && requireAuth && !isAuthenticated && !token) {
      // 保存当前路径，登录后返回
      const currentUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
    }
  }, [isAuthenticated, token, isLoading, pathname, router, searchParams, requireAuth]);

  // 加载过程中不显示任何内容，避免闪烁
  if (isLoading) {
    return null;
  }

  return <>{children}</>;
}