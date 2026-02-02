'use client'

import { Card, Row, Col } from 'antd';
import { Line, Pie } from '@ant-design/charts';

export default function TestChartPage() {
  // 测试数据
  const qualityTrend = [
    { month: '1月', score: 85 },
    { month: '2月', score: 87 },
    { month: '3月', score: 89 },
    { month: '4月', score: 90 },
    { month: '5月', score: 91 },
    { month: '6月', score: 92.5 },
  ];

  const dataDistribution = [
    { name: '主数据', value: 400 },
    { name: '参考数据', value: 300 },
    { name: '交易数据', value: 250 },
    { name: '元数据', value: 150 },
    { name: '其他数据', value: 180 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">图表测试页面</h1>

      <Row gutter={[16, 16]}>
        {/* 数据质量趋势 */}
        <Col span={12}>
          <Card title="数据质量趋势">
            <Line
              data={qualityTrend}
              xField="month"
              yField="score"
              smooth
              yAxis={{
                min: 80,
                max: 100,
              }}
            />
          </Card>
        </Col>

        {/* 数据分布 */}
        <Col span={12}>
          <Card title="数据元素分布">
            <Pie
              data={dataDistribution}
              angleField="value"
              colorField="name"
              radius={0.8}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}