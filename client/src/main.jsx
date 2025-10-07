import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode >
    <App className=' w-screen h-screen bg-gray-800 p-6' />
  </StrictMode>,
)
