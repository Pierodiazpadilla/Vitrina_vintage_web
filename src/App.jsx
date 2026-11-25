import { Routes, Route } from 'react-router-dom'

function Placeholder() {
  return (
    <main className="p-4">
      <h1 className="font-display text-navy">VITRINA VINTAGE</h1>
    </main>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="*" element={<Placeholder />} />
    </Routes>
  )
}
