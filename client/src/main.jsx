import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'            // 1. Font import
import './index.css'                           // 2. Tailwind base + global styles
import './App.css'                             // 3. Local styles (no Tailwind import)
import App from './App'                        // 4. Actual React component

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App className="w-screen h-screen" />
  </StrictMode>,
)

