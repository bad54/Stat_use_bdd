<template>
  <div ref="chartEl" :style="{ height: height ?? '300px' }" />
</template>

<script setup lang="ts">
import * as echarts from 'echarts'

const props = defineProps<{
  data: { name: string; value: number }[]
  height?: string
  donut?: boolean
}>()

const chartEl = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null

const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']

function initChart() {
  if (!chartEl.value) return
  chart = echarts.init(chartEl.value)
  updateChart()
}

function updateChart() {
  if (!chart) return

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      backgroundColor: '#1e293b',
      borderColor: 'transparent',
      textStyle: { color: '#f1f5f9', fontSize: 12 },
      formatter: (p: any) => {
        const val = new Intl.NumberFormat('fr-FR').format(p.value)
        return `<div style="font-size:12px"><strong>${p.name}</strong><br/>${val} (${p.percent}%)</div>`
      },
    },
    legend: {
      orient: 'vertical',
      right: 0,
      top: 'center',
      textStyle: { color: '#6b7280', fontSize: 12 },
      formatter: (name: string) => name.length > 20 ? name.slice(0, 18) + '…' : name,
    },
    series: [{
      type: 'pie',
      radius: props.donut ? ['40%', '70%'] : '60%',
      center: ['40%', '50%'],
      data: props.data,
      emphasis: {
        itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' },
      },
      itemStyle: {
        borderRadius: 6,
        borderColor: '#fff',
        borderWidth: 2,
        color: (p: any) => colors[p.dataIndex % colors.length],
      },
      label: { show: false },
    }],
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

watch(() => props.data, () => updateChart(), { deep: true })
</script>
