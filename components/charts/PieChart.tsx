'use client'

import React from 'react'
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ChartOptions, PieChartData } from '@/types'
import { ChartError } from './ChartError'

interface PieChartProps {
  data: PieChartData[]
  options?: ChartOptions
}

export function PieChart({ data, options = {} }: PieChartProps) {
  // Validate data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <ChartError message="No data available for pie chart" />
  }

  // Validate data structure
  const hasValidStructure = data.every(item => 
    item.hasOwnProperty('name') && item.hasOwnProperty('value')
  )
  
  if (!hasValidStructure) {
    return <ChartError message="Pie chart data must have 'name' and 'value' properties" />
  }

  const {
    colors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'],
    showLegend = true,
    showTooltip = true,
    responsive = true,
    width = 600,
    height = 400,
    margin = { top: 20, right: 30, left: 20, bottom: 5 }
  } = options

  const ChartComponent = responsive ? ResponsiveContainer : 'div'
  const chartProps = responsive ? { width: '100%', height: height } : { width, height }

  // Calculate total for percentage display
  const total = data.reduce((sum, item) => sum + item.value, 0)

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const percentage = ((data.value / total) * 100).toFixed(1)
      return (
        <div className="bg-card p-3 border border-border rounded-lg shadow-sm text-primary">
          <p className="text-sm font-medium">{data.name}</p>
          <p className="text-sm text-primary/80">
            Value: {data.value} ({percentage}%)
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <ChartComponent {...chartProps}>
      <RechartsPieChart
        margin={margin}
        {...(!responsive && { width, height })}
      >
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={responsive ? '60%' : 120}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.color || colors[index % colors.length]} 
            />
          ))}
        </Pie>
        {showTooltip && <Tooltip content={<CustomTooltip />} />}
        {showLegend && (
          <Legend 
            wrapperStyle={{ fontSize: '12px' }}
            verticalAlign="bottom"
            height={36}
          />
        )}
      </RechartsPieChart>
    </ChartComponent>
  )
}