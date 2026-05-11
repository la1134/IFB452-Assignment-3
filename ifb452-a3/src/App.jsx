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

  const handleSaveProject = async (formData) => {
    setIsLoading(true);
    
    const isEditing = !!formData.id;
    
    let projectPayload;
    if (isEditing) {
      projectPayload = { ...formData };
    } else {
      projectPayload = {
        ...formData,
        id: Date.now().toLocaleString(),
        balance: 0,
      };
    }

    const url = isEditing 
      ? `http://localhost:3001/projects/${projectPayload.id}` 
      : 'http://localhost:3001/projects';
      
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectPayload)
      });

      if (response.ok) {
        const savedProject = await response.json();
        
        const projectForUI = {
          ...savedProject,
          banner: BannerImg,
          deadline: new Date(savedProject.deadline)
        };

        setProjects(prev => {
          if (isEditing) {
            return prev.map(p => p.id === savedProject.id ? projectForUI : p);
          } else {
            return [ ...prev, projectForUI];
          }
        });
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("There was an error saving the project.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContribute = async (projectId, amount) => {
  setIsLoading(true);
  try {
    const projectToUpdate = projects.find(p => p.id === projectId);
    if (!projectToUpdate) return;

    const updatedBalance = projectToUpdate.balance + amount;

    const response = await fetch(`http://localhost:3001/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ balance: updatedBalance })
    });

    if (response.ok) {
      const updatedProject = await response.json();
      
      setProjects(prev => prev.map(p => 
        p.id === projectId 
          ? { ...p, balance: updatedProject.balance } 
          : p
      ));
    }
  } catch (err) {
    console.error("Contribution error:", err);
  } finally {
    setIsLoading(false);
  }
};

  return (
    <Routes>
      <Route element={<Layout/>}>
        <Route path="/" element={<ProjectGrid connectionsData={projects} onSaveProject={handleSaveProject} onContribute={handleContribute} isLoading={isLoading}/>}/>
      </Route>
    </Routes>
  )
}

export default App