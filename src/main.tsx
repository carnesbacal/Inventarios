import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { startOutbox } from './lib/outbox'

// Arranca el envio en segundo plano de la cola offline.
startOutbox()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
