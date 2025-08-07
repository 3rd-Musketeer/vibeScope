import { Header } from '@/components/layout/header'
import { MainArea } from '@/components/layout/main-area'
import { RightSidebar } from '@/components/layout/right-sidebar'
import { Footer } from '@/components/layout/footer'
import { LogViewer } from '@/components/debug/log-viewer'

export default function Dashboard() {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <MainArea />
        <RightSidebar />
      </div>
      <Footer />
      <LogViewer />
    </div>
  )
}
