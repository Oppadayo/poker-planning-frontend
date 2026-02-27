import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HomePage } from '@/routes/HomePage'
import { RoomPage } from '@/routes/RoomPage'
import { InvitePage } from '@/routes/InvitePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/rooms/:roomId" element={<RoomPage />} />
        <Route path="/invite/:token" element={<InvitePage />} />
      </Routes>
    </BrowserRouter>
  )
}
