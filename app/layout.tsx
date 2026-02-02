import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ConfigProvider, theme, App } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import LayoutContent from './components/LayoutContent'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DGMP - 数据治理管理平台',
  description: '数据治理管理平台，实现数据治理的决策与执行分离',
}

// 统一的主题配置
const { defaultAlgorithm, defaultTheme } = theme;
const customTheme = {
  algorithm: defaultAlgorithm,
  token: {
    colorPrimary: '#1890ff',
    colorLink: '#1890ff',
    colorInfo: '#1890ff',
    borderRadius: 4,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <App>
          <ConfigProvider locale={zhCN} theme={customTheme}>
            <LayoutContent>{children}</LayoutContent>
          </ConfigProvider>
        </App>
      </body>
    </html>
  )
}
