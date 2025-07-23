'use client'

import React from 'react'
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ChartOptions, LineChartData } from '@/types'
import { ChartError } from './ChartError'

interface LineChartProps {
  data: LineChartData[]
  xKey?: string
  yKey?: string
  options?: ChartOptions
}

export function LineChart({ data, xKey = 'name', yKey = 'value', options = {} }: LineChartProps) {
  // Validate data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <ChartError message="No data available for line chart" />
  }

  // Validate keys exist in data
  const sampleItem = data[0]
  if (!sampleItem.hasOwnProperty(xKey) || !sampleItem.hasOwnProperty(yKey)) {
    return <ChartError message={`Missing required keys: ${xKey} or ${yKey}`} />
  }

  const {
    colors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'],
    showLegend = true,
    showGrid = true,
    showTooltip = true,
    responsive = true,
    width = 600,
    height = 400,
    margin = { top: 20, right: 30, left: 20, bottom: 5 }
  } = options

  const ChartComponent = responsive ? ResponsiveContainer : 'div'
  const chartProps = responsive ? { width: '100%', height: height } : { width, height }

  return (
    <ChartComponent {...chartProps}>
      <RechartsLineChart
        data={data}
        margin={margin}
        {...(!responsive && { width, height })}
      >
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />}
        <XAxis 
          dataKey={xKey} 
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          stroke="hsl(var(--border))"
        />
        <YAxis 
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          stroke="hsl(var(--border))"
        />
        {showTooltip && (
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
              fontSize: '12px',
              color: 'hsl(var(--primary))',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            labelStyle={{
              color: 'hsl(var(--primary))',
              fontWeight: '500'
            }}
            itemStyle={{
              color: 'hsl(var(--primary))'
            }}
          />
        )}
        {showLegend && (
          <Legend 
            wrapperStyle={{ fontSize: '12px' }}
          />
        )}
        <Line 
          type="monotone" 
          dataKey={yKey} 
          stroke={colors[0]}
          strokeWidth={2}
          dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, fill: colors[0] }}
        />
      </RechartsLineChart>
    </ChartComponent>
  )
}