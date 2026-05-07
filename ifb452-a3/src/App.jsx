import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProjectGrid from './components/ProjectGrid'
import Banner from "./assets/manage-profile-placeholder.jpg"

const testConnectionsData = [
  {
    banner: Banner,
    title: "Project Title",
    owner: "Project Owner",
    deadline: new Date("2026-11-07"),
    goal: 100000,
    balance: 50000
  },
  {
    banner: Banner,
    title: "Project Title",
    owner: "Project Owner",
    deadline: new Date("2026-11-07"),
    goal: 100000,
    balance: 50000
  },
  {
    banner: Banner,
    title: "Project Title",
    owner: "Project Owner",
    deadline: new Date("2026-11-07"),
    goal: 100000,
    balance: 50000
  }
]

function App() {
  return (
    <Routes>
      <Route element={<Layout/>}>
        <Route path="/" element={<ProjectGrid connectionsData={testConnectionsData}/>}/>
      </Route>
    </Routes>
  )
}

export default App