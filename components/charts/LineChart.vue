<template>
  <div ref="chartEl" :style="{ height: height ?? '300px' }" />
</template>

<script setup lang="ts">
import * as echarts from 'echarts'

const props = defineProps<{
  series: { name: string; data: number[]; color?: string }[]
  categories: string[]
  height?: string
  smooth?: boolean
}>()

const chartEl = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null

const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

function initChart() {
  if (!chartEl.value) return
  chart = echarts.init(chartEl.value)
  updateChart()
}

function updateChart() {
  if (!chart) return

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1e293b',
      borderColor: 'transparent',
      textStyle: { color: '#f1f5f9', fontSize: 12 },
      formatter: (params: any) => {
        const lines = params.map((p: any) =>
          `<div class="flex justify-between gap-4"><span>${p.marker}${p.seriesName}</span><strong>${new Intl.NumberFormat('fr-FR').format(p.value)}</strong></div>`
        )
        return `<div style="font-size:12px"><div style="margin-bottom:4px;color:#94a3b8">${params[0].name}</div>${lines.join('')}</div>`
      },
    },
    legend: {
      bottom: 0,
      textStyle: { color: '#6b7280', fontSize: 12 },
    },
    grid: { top: 10, right: 20, bottom: 40, left: 60 },
    xAxis: {
      type: 'category',
      data: props.categories,
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisTick: { show: false },
      axisLabel: { color: '#9ca3af', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#9ca3af',
        fontSize: 11,
        formatter: (v: number) => new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(v),
      },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
    },
    series: props.series.map((s, i) => ({
      name: s.name,
      type: 'line',
      data: s.data,
      smooth: props.smooth ?? true,
      symbol: 'circle',
      symbolSize: 5,
      lineStyle: { width: 2.5, color: s.color ?? colors[i % colors.length] },
      itemStyle: { color: s.color ?? colors[i % colors.length] },
      areaStyle: props.series.length === 1 ? {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: (s.color ?? colors[0]) + '30' },
          { offset: 1, color: (s.color ?? colors[0]) + '00' },
        ]),
      } : undefined,
    })),
  }

  chart.setOption(option)
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', () => chart?.resize())
})

onUnmounted(() => {
  chart?.dispose()
  window.removeEventListener('resize', () => chart?.resize())
})

watch(() => [props.series, props.categories], () => updateChart(), { deep: true })
</script>
