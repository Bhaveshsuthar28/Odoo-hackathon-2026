'use client';

import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface ChartProps {
  option: echarts.EChartsOption;
  height?: string;
  className?: string;
}

export function Chart({ option, height = '320px', className = '' }: ChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  // Initialize once and observe container dimension changes (e.g. sidebar collapse)
  useEffect(() => {
    if (!chartRef.current) return;

    const instance = echarts.init(chartRef.current);
    chartInstance.current = instance;

    const resizeObserver = new ResizeObserver(() => {
      instance.resize();
    });
    resizeObserver.observe(chartRef.current);

    return () => {
      resizeObserver.disconnect();
      instance.dispose();
      chartInstance.current = null;
    };
  }, []);

  // Smoothly update options without destroying canvas context or incurring GC overhead
  useEffect(() => {
    if (chartInstance.current && option) {
      chartInstance.current.setOption(option, { notMerge: false, lazyUpdate: true });
    }
  }, [option]);

  return <div ref={chartRef} style={{ height }} className={`w-full ${className}`} />;
}
