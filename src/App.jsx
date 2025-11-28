import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import LayoutShell from './components/LayoutShell'
import Landing from './pages/Landing'
import Feed from './pages/Feed'
import ArticleDetail from './pages/ArticleDetail'
import ArticleTrail from './pages/ArticleTrail'
import ExploreGraph from './pages/ExploreGraph'
import Verify from './pages/Verify'
import About from './pages/About'

function App() {
  return (
    <>
      <LayoutShell>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/article/:id" element={<ArticleDetail />} />
          <Route path="/article/:id/trail" element={<ArticleTrail />} />
          <Route path="/explore/graph" element={<ExploreGraph />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </LayoutShell>
      <Toaster position="bottom-right" richColors />
    </>
  )
}

export default App

