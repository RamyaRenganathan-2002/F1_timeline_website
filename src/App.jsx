import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import ScrollToTop from './components/ScrollToTop'
import Home from './pages/Home'
import Timeline from './pages/Timeline'
import TeamDetail from './pages/TeamDetail'
import DriverDetail from './pages/DriverDetail'
import SeasonDetail from './pages/SeasonDetail'
import Teams from './pages/Teams'
import Drivers from './pages/Drivers'
import Seasons from './pages/Seasons'
import Circuits from './pages/Circuits'
import CircuitDetail from './pages/CircuitDetail'
import Live from './pages/Live'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <>
      <Navbar />
      <ScrollToTop />
      <main style={{ minHeight: '100vh' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/team/:id" element={<TeamDetail />} />
          <Route path="/driver/:id" element={<DriverDetail />} />
          <Route path="/season/:year" element={<SeasonDetail />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/drivers" element={<Drivers />} />
          <Route path="/seasons" element={<Seasons />} />
          <Route path="/circuits" element={<Circuits />} />
          <Route path="/circuit/:id" element={<CircuitDetail />} />
          <Route path="/live" element={<Live />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  )
}