'use client'

import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, List, Button, Badge, Tag, Menu, Avatar } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, UserOutlined, DatabaseOutlined, LinkOutlined, CheckCircleOutlined, ClockCircleOutlined, AlertOutlined, BarChartOutlined } from '@ant-design/icons';
import { Bar, Line, Pie } from '@ant-design/charts';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth';

const { Title, Text } = Typography;

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [dashboardData, setDashboardData] = useState({
    totalDataElements: 1280,
    totalDataSources: 32,
    totalMappingRules: 256,
    totalQualityRules: 128,
    totalTasks: 64,
    qualityScore: 92.5,
    recentTasks: [
      {
        id: 1,
        title: '数据元素分类审核',
        status: 'pending',
        assignee: '张三',
        dueDate: '2024-01-30',
      },
      {
        id: 2,
        title: '映射规则验证',
        status: 'in-progress',
        assignee: '李四',
        dueDate: '2024-01-28',
      },
      {
        id: 3,
        title: '质量规则更新',
        status: 'completed',
        assignee: '王五',
        dueDate: '2024-01-25',
      },
      {
        id: 4,
        title: '外部数据源连接测试',
        status: 'pending',
        assignee: '赵六',
        dueDate: '2024-01-31',
      },
    ],
    qualityTrend: [
      { month: '1月', score: 85 },
      { month: '2月', score: 87 },
      { month: '3月', score: 89 },
      { month: '4月', score: 90 },
      { month: '5月', score: 91 },
      { month: '6月', score: 92.5 },
    ],
    dataDistribution: [
      { name: '主数据', value: 400 },
      { name: '参考数据', value: 300 },
      { name: '交易数据', value: 250 },
      { name: '元数据', value: 150 },
      { name: '其他数据', value: 180 },
    ],
  });

  // 模拟数据加载
  useEffect(() => {
    // 在实际应用中，这里会从API获取真实数据
    const fetchData = async () => {
      // 模拟API请求延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      // 数据已经在初始状态中设置
    };

    fetchData();
  }, []);

  // 状态标签配置
  const statusConfig = {
    pending: { color: 'orange', text: '待处理' },
    'in-progress': { color: 'blue', text: '处理中' },
    completed: { color: 'green', text: '已完成' },
  };

  // 功能模块配置
  const modules = [
    {
      title: '数据元素管理',
      icon: <DatabaseOutlined style={{ fontSize: '24px', color: '#1890ff' }} />,
      count: dashboardData.totalDataElements,
      href: '/dashboard/data-elements',
      description: '管理和维护数据元素的定义、属性和关系',
    },
    {
      title: '外部数据源管理',
      icon: <LinkOutlined style={{ fontSize: '24px', color: '#52c41a' }} />,
      count: dashboardData.totalDataSources,
      href: '/dashboard/data-sources',
      description: '配置和管理外部数据源的连接和同步',
    },
    {
      title: '映射规则管理',
      icon: <LinkOutlined style={{ fontSize: '24px', color: '#faad14' }} />,
      count: dashboardData.totalMappingRules,
      href: '/dashboard/mapping-rules',
      description: '定义和管理数据之间的映射关系',
    },
    {
      title: '质量规则管理',
      icon: <CheckCircleOutlined style={{ fontSize: '24px', color: '#f5222d' }} />,
      count: dashboardData.totalQualityRules,
      href: '/dashboard/quality-rules',
      description: '定义和管理数据质量检查规则',
    },
    {
      title: '任务管理',
      icon: <ClockCircleOutlined style={{ fontSize: '24px', color: '#722ed1' }} />,
      count: dashboardData.totalTasks,
      href: '/dashboard/tasks',
      description: '分配和跟踪数据治理相关任务',
    },
    {
      title: '用户和角色管理',
      icon: <UserOutlined style={{ fontSize: '24px', color: '#13c2c2' }} />,
      count: 42,
      href: '/dashboard/users',
      description: '管理系统用户和角色权限',
    },
  ];

  return (
    <div>
      {/* 欢迎区域 */}
      <div style={{ marginBottom: '24px' }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={4} style={{ marginBottom: '8px' }}>
              欢迎回来，{user?.realName || user?.username || '用户'}！
            </Title>
            <Text type="secondary">
              这里是您的数据治理管理平台仪表盘，实时监控系统状态和数据质量。
            </Text>
          </Col>
          <Col>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Button type="primary">
                <Link href="/dashboard/tasks">查看所有任务</Link>
              </Button>
              <Avatar size="large">
                {user?.username?.[0] || 'U'}
              </Avatar>
            </div>
          </Col>
        </Row>
      </div>

      {/* 关键指标卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="数据元素总数"
              value={dashboardData.totalDataElements}
              prefix={<DatabaseOutlined />}
              styles={{ content: { color: '#1890ff' } }}
              suffix={<ArrowUpOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="外部数据源"
              value={dashboardData.totalDataSources}
              prefix={<LinkOutlined />}
              styles={{ content: { color: '#52c41a' } }}
              suffix={<ArrowUpOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="数据质量评分"
              value={dashboardData.qualityScore}
              prefix={<CheckCircleOutlined />}
              styles={{ content: { color: '#faad14' } }}
              suffix={<span>%</span>}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待处理任务"
              value={12}
              prefix={<ClockCircleOutlined />}
              styles={{ content: { color: '#f5222d' } }}
              suffix={<ArrowUpOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 功能模块入口 */}
      <Title level={5} style={{ marginBottom: '16px' }}>功能模块</Title>
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {modules.map((module, index) => (
          <Col key={index} xs={24} sm={12} md={8} lg={6}>
            <Card
              hoverable
              style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
              actions={[
                <Link href={module.href} key="view">
                  查看详情
                </Link>,
              ]}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                {module.icon}
                <Title level={5} style={{ margin: 0, marginLeft: '12px', flex: 1 }}>
                  {module.title}
                </Title>
              </div>
              <Text type="secondary" style={{ display: 'block', marginBottom: '16px', flex: 1 }}>
                {module.description}
              </Text>
              <div style={{ marginTop: 'auto' }}>
                <Statistic
                  value={module.count}
                  styles={{ content: { fontSize: '20px', color: '#666' } }}
                />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 图表和数据区域 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {/* 数据质量趋势 */}
        <Col span={12}>
          <Card 
            title="数据质量趋势" 
            extra={<Text type="secondary">最近6个月</Text>}
            style={{ height: '100%' }}
          >
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text>数据质量趋势图表</Text>
            </div>
          </Card>
        </Col>

        {/* 数据分布 */}
        <Col span={12}>
          <Card 
            title="数据元素分布" 
            extra={<Text type="secondary">按数据类型</Text>}
            style={{ height: '100%' }}
          >
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text>数据元素分布图表</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 最近任务 */}
      <Title level={5} style={{ marginBottom: '16px' }}>最近任务</Title>
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {dashboardData.recentTasks.map((item) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid #f0f0f0' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '4px' }}>{item.title}</div>
                <Text type="secondary">
                  负责人：{item.assignee} | 截止日期：{item.dueDate}
                </Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Tag color={statusConfig[item.status as keyof typeof statusConfig].color}>
                  {statusConfig[item.status as keyof typeof statusConfig].text}
                </Tag>
                <Link href={`/dashboard/tasks/${item.id}`}>
                  查看详情
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
