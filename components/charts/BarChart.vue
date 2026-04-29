<template>
  <div ref="chartEl" :style="{ height: height ?? '300px' }" />
</template>

<script setup lang="ts">
import * as echarts from 'echarts'

const props = defineProps<{
  series: { name: string; data: number[]; color?: string }[]
  categories: string[]
  height?: string
  horizontal?: boolean
  stacked?: boolean
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

  const axisConfig = {
    type: 'category' as const,
    data: props.categories,
    axisLine: { lineStyle: { color: '#e5e7eb' } },
    axisTick: { show: false },
    axisLabel: { color: '#9ca3af', fontSize: 11 },
  }

  const valueConfig = {
    type: 'value' as const,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: {
      color: '#9ca3af',
      fontSize: 11,
      formatter: (v: number) => new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(v),
    },
    splitLine: { lineStyle: { color: '#f3f4f6' } },
  }

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1e293b',
      borderColor: 'transparent',
      textStyle: { color: '#f1f5f9', fontSize: 12 },
      axisPointer: { type: 'shadow' },
    },
    legend: props.series.length > 1 ? { bottom: 0, textStyle: { color: '#6b7280', fontSize: 12 } } : undefined,
    grid: {
      top: 10,
      right: props.horizontal ? 20 : 10,
      bottom: props.series.length > 1 ? 50 : 30,
      left: props.horizontal ? 120 : 60,
    },
    xAxis: props.horizontal ? valueConfig : axisConfig,
    yAxis: props.horizontal ? axisConfig : valueConfig,
    series: props.series.map((s, i) => ({
      name: s.name,
      type: 'bar',
      data: s.data,
      stack: props.stacked ? 'stack' : undefined,
      barMaxWidth: 40,
      itemStyle: {
        color: s.color ?? colors[i % colors.length],
        borderRadius: props.horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
      },
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
