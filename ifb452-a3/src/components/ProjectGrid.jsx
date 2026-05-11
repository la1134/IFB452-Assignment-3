
import { useState } from 'react';
import ProjectView from './ProjectView';
import EditView from './EditView';
import timeIcon from "../assets/time.svg"
import plusIcon from "../assets/plus.svg";
import LoadingSpinner from './LoadingSpinner'
import ContributeView from './ContributeView';

const ProjectGrid = ({ connectionsData, onSaveProject, onContribute, isLoading }) => {

  const currentDate = new Date();
  const [projectData, setProjectData] = useState(null);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showContributePopup, setShowContributePopup] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const handleViewProject = (project) => {
    setProjectData({
      ...project,
      daysLeft: Math.ceil((project.deadline - currentDate) / (1000 * 60 * 60 * 24)),
      percentageFunded: Math.round((project.balance / project.goal) * 100)
    });
    setShowProfilePopup(true);
  }

  const handleEditProject = (project = null) => {
    setEditingProject(project);
    setShowEditPopup(true);
  }

  const handleCloseProfile = () => {
    setShowProfilePopup(false);
    setProjectData(null);
  }

  const handleCloseEdit = () => {
    setShowEditPopup(false);
    setEditingProject(null);
  }

  const handleOpenContribute = () => {
    setShowContributePopup(true);
  };

  return (
    <div>

      <button 
        className="flex items-center gap-2 bg-[#028858] text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-[#039260] transition-colors mx-auto"
        onClick={() => handleEditProject(null)}
      >
        <img 
          src={plusIcon} 
          alt="Plus" 
          className="w-5 h-5"
        />
        <span>Create New Project</span>
      </button>

      <div className="pt-6">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 w-[75%] mx-auto">
            {connectionsData.map((project) => {
              const daysLeft = Math.ceil((project.deadline - currentDate) / (1000 * 60 * 60 * 24));
              const percentageFunded = Math.round((project.balance / project.goal) * 100);
              const barWidth = Math.min(percentageFunded, 100);

              return (
                <div key={project.id} className="flex flex-col items-center m-2">
                  <a onClick={() => handleViewProject(project)} className="cursor-pointer bg-[#43444d] sm:w-100 md:w-67.5 lg:w-93.75 xl:w-78.75 2xl:w-100 h-full rounded-lg shadow-xl">
                    <img 
                      src={project.banner}
                      alt="Profile Banner"
                      className="w-full h-50 object-cover object-[0%_20%] rounded-t-lg"
                    ></img>
                    <div>
                      <div className="flex flex-col items-center py-4 text-white">
                        <h2 className="text-center text-xl font-semibold">{project.title}</h2>
                        <p className="text-center text-xs px-6 pb-4 text-gray-300">{project.owner}</p>
                        <div className="flex items-center justify-between w-full px-16 gap-x-6">

                          <div className="flex items-center gap-x-1 shrink-0">
                            <img src={timeIcon} className="w-3.5 h-3.5 opacity-80"/>
                            <p className="text-sm font-semibold text-gray-200 whitespace-nowrap">
                              {daysLeft.toLocaleString()} days
                            </p>
                          </div>

                          <div className="flex items-center gap-x-2 flex-1">
                            <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500 transition-all duration-500 ease-out"
                                style={{ width: `${barWidth}%` }}
                              ></div>
                            </div>
                            <p className="text-sm font-semibold text-gray-200 whitespace-nowrap shrink-0">
                              {percentageFunded}% funded
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </a>
                </div>
                );
              })}
            </div>
          )}
        </div>

          {showProfilePopup && projectData && (
            <ProjectView 
                projectData={projectData} 
                onClose={handleCloseProfile}
                onEdit={() => {
                    handleEditProject(projectData);
                    handleCloseProfile();
                }}
                onBackClick={handleOpenContribute}
            />
          )}

          {showEditPopup && (
            <EditView 
              projectData={editingProject}
              onClose={handleCloseEdit} 
              onSaveProject={(data) => {
                onSaveProject(data);
                handleCloseEdit();
              }}
            />
          )}

          {showContributePopup && projectData && (
            <ContributeView 
              projectData={projectData}
              onClose={() => setShowContributePopup(false)}
              onContribute={(amount) => {
                onContribute(projectData.id, amount);
                setShowContributePopup(false);
                handleCloseProfile();
              }}
            />
          )}

        </div>
  )
}

export default ProjectGrid;
