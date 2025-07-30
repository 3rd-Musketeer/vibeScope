'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { BarChart3, PieChart } from 'lucide-react'
import { useProjectStats } from '@/hooks/use-projects'
import { useStore } from '@/lib/store'
import ReactECharts from 'echarts-for-react'

export function ChartsSidebar() {
  const { currentProjectId } = useStore()
  const { data: stats, isLoading } = useProjectStats(currentProjectId)

  const getPieChartOption = () => {
    if (!stats) return null
    
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        textStyle: { fontSize: 10 }
      },
      series: [
        {
          name: '任务状态',
          type: 'pie',
          radius: ['30%', '60%'],
          data: [
            { value: stats.pending_tasks, name: '等待中' },
            { value: stats.processing_tasks, name: '进行中' },
            { value: stats.failed_tasks, name: '失败' },
            { value: stats.successful_tasks, name: '成功' }
          ].filter(item => item.value > 0),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    }
  }

  const getBarChartOption = () => {
    if (!stats) return null
    
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: ['等待中', '进行中', '失败', '成功'],
        axisLabel: { fontSize: 10 }
      },
      yAxis: {
        type: 'value',
        axisLabel: { fontSize: 10 }
      },
      series: [
        {
          name: '任务数量',
          type: 'bar',
          data: [
            stats.pending_tasks,
            stats.processing_tasks,
            stats.failed_tasks,
            stats.successful_tasks
          ],
          itemStyle: {
            color: function(params: any) {
              const colors = ['#facc15', '#3b82f6', '#ef4444', '#22c55e']
              return colors[params.dataIndex]
            }
          }
        }
      ]
    }
  }

  if (!currentProjectId) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <PieChart className="w-4 h-4 mr-2" />
              状态分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-24 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
              请选择项目
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              处理统计
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-24 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
              请选择项目
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Dialog>
        <DialogTrigger asChild>
          <Card className="cursor-pointer hover:shadow-sm transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center">
                <PieChart className="w-4 h-4 mr-2" />
                状态分布
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-24 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                  加载中...
                </div>
              ) : (
                <div className="h-24">
                  <ReactECharts
                    option={getPieChartOption()}
                    style={{ height: '96px' }}
                    opts={{ renderer: 'svg' }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>任务状态分布</DialogTitle>
          </DialogHeader>
          <div className="h-96">
            <ReactECharts
              option={getPieChartOption()}
              style={{ height: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog>
        <DialogTrigger asChild>
          <Card className="cursor-pointer hover:shadow-sm transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                处理统计
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-24 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                  加载中...
                </div>
              ) : (
                <div className="h-24">
                  <ReactECharts
                    option={getBarChartOption()}
                    style={{ height: '96px' }}
                    opts={{ renderer: 'svg' }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>任务处理统计</DialogTitle>
          </DialogHeader>
          <div className="h-96">
            <ReactECharts
              option={getBarChartOption()}
              style={{ height: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}