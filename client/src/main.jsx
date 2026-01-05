import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import './index.css'
import './App.css'
import App from './App'
// import { registerSW } from 'virtual:pwa-register'

// registerSW({ immediate: true })

// Force unregister SW for debugging/dev purposes to clear old cache
if (navigator.serviceWorker) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      registration.unregister()
    }
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App className="w-screen h-screen" />
  </StrictMode>,
)
