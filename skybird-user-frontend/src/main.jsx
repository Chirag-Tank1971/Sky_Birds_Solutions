import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'motion/react'
import './index.css'
import App from './App.jsx'
import FloatingContactButtons from './components/FloatingContactButtons.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Respect the visitor's "reduce motion" system setting for every animation. */}
    <MotionConfig reducedMotion="user">
      <App />
      <FloatingContactButtons />
    </MotionConfig>
  </StrictMode>,
)
