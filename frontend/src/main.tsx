import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
// Initialize PWA utilities (service worker, offline detection, install prompt)
import '@utils/pwa'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
