import { Route, Routes } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import HomePage from './pages/HomePage'
import PopularBooksPage from './pages/PopularBooksPage'
import TextbookSearchPage from './pages/TextbookSearchPage'

function Placeholder({ title }: { title: string }) {
  return (
    <div className="min-h-full pb-20 flex items-center justify-center text-gray-400 text-sm">
      {title} (준비중)
    </div>
  )
}

export default function App() {
  return (
    <div className="mx-auto max-w-md min-h-full bg-white relative">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<TextbookSearchPage />} />
        <Route path="/popular" element={<PopularBooksPage />} />
        <Route path="/notice" element={<Placeholder title="공지" />} />
        <Route path="/greeting" element={<Placeholder title="인사" />} />
        <Route path="/menu" element={<Placeholder title="메뉴" />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
      <BottomNav />
    </div>
  )
}
