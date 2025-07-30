import { Header } from '@/components/layout/header'
import { MainArea } from '@/components/layout/main-area'
import { LeftSidebar } from '@/components/layout/left-sidebar'
import { RightSidebar } from '@/components/layout/right-sidebar'
import { Footer } from '@/components/layout/footer'

export default function Dashboard() {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <MainArea />
        <RightSidebar />
      </div>
      <Footer />
    </div>
  )
}
