import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <section id="center">
        <div>
          <h1>IFB452 Assignment 3</h1>
          <p>
            Placeholder text
          </p>
        </div>
      </section>
      <section id="spacer"></section>
    </>
  )
}

export default App
