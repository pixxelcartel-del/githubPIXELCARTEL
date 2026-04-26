import { BrowserRouter, Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import Home from './pages/Home'
import Marketplace from './pages/Marketplace'
import Profile from './pages/Profile'

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/profile/:address?" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  )
}
