"use client";

import { useTheme } from 'next-themes';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface TrendChartProps {
    data: any[];
    dataKey: string;
    category?: string; // Optional second dataKey for comparison (e.g. expenses)
    colors?: { stroke: string; fill: string; };
    height?: number;
}

export function TrendChart({ data, dataKey, category, colors, height = 300 }: TrendChartProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Default colors if not provided
    const primaryColor = colors?.stroke || (isDark ? '#818cf8' : '#4f46e5'); // Indigo 400/600
    const primaryFill = colors?.fill || (isDark ? '#3730a3' : '#e0e7ff'); // Indigo 900/100

    const secondaryColor = isDark ? '#f87171' : '#ef4444'; // Red 400/500
    const secondaryFill = isDark ? '#7f1d1d' : '#fee2e2'; // Red 900/100

    return (
        <div className="w-full" style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id={`${dataKey}-gradient`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                        </linearGradient>
                        {category && (
                            <linearGradient id={`${category}-gradient`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={secondaryColor} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={secondaryColor} stopOpacity={0} />
                            </linearGradient>
                        )}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333' : '#eee'} vertical={false} />
                    <XAxis
                        dataKey="name"
                        stroke={isDark ? '#888' : '#666'}
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                    />
                    <YAxis
                        stroke={isDark ? '#888' : '#666'}
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `€${value / 1000}k`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: isDark ? '#1f2937' : '#fff',
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                        itemStyle={{ color: isDark ? '#fff' : '#000' }}
                        formatter={(value: number) => [`€ ${value.toLocaleString('it-IT')}`, '']}
                    />
                    <Area
                        type="monotone"
                        dataKey={dataKey}
                        stroke={primaryColor}
                        strokeWidth={3}
                        fillOpacity={1}
                        fill={`url(#${dataKey}-gradient)`}
                    />
                    {category && (
                        <Area
                            type="monotone"
                            dataKey={category}
                            stroke={secondaryColor}
                            strokeWidth={3}
                            fillOpacity={1}
                            fill={`url(#${category}-gradient)`}
                        />
                    )}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
