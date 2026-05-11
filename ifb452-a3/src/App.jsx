import { Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import "./App.css"
import Layout from './components/Layout'
import ProjectGrid from './components/ProjectGrid'
import projectDataRaw from './data/projects.json';
import BannerImg from './assets/banner.jpg';

function App() {

  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('http://localhost:3001/projects');
        const data = await response.json();
        
        const formattedData = data.map(p => ({
          ...p,
          deadline: new Date(p.deadline),
          banner: BannerImg
        }));
        setProjects(formattedData);
      } catch (err) {
        console.error("Server not running? Run npx json-server...", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handlePublish = async (formData) => {
    setIsLoading(true);
    const newProject = {
      ...formData,
      id: Date.now().toString(),
      balance: 0
    };

    try {
      const response = await fetch('http://localhost:3001/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject)
      });

      if (response.ok) {
        const savedProject = await response.json();
        
        const projectForUI = {
          ...savedProject,
          deadline: new Date(savedProject.deadline),
          banner: BannerImg
        };

        setProjects(prevProjects => {
          const exists = prevProjects.find(p => p.id === projectForUI.id);
          if (exists) return prevProjects;
          return [projectForUI, ...prevProjects];
        });
      }
    } catch (err) {
      console.error("Publish error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Routes>
      <Route element={<Layout/>}>
        <Route path="/" element={<ProjectGrid connectionsData={projects} onPublish={handlePublish} isLoading={isLoading}/>}/>
      </Route>
    </Routes>
  )
}

export default App