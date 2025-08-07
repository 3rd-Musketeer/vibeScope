'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { TabbedMainArea } from '@/components/layout/tabbed-main-area'
import { Footer } from '@/components/layout/footer'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('notes')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // 检查用户是否已登录
    const token = localStorage.getItem('system_auth_token')
    if (!token) {
      router.push('/login')
    } else {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [router])

  // 显示加载状态
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    )
  }

  // 如果未认证，不显示内容（会被重定向到登录页面）
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <TabbedMainArea activeTab={activeTab} />
      <Footer />
    </div>
  )
}
