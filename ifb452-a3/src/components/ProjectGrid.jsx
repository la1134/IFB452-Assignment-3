
import { useState } from 'react';
import timeIcon from "../assets/time.svg"
import ProjectView from './ProjectView';

const ProjectGrid = ({connectionsData}) => {
  const currentDate = new Date();
  const [projectData, setProjectData] = useState(null);
  const [showProfilePopup, setShowProfilePopup] = useState(false);

  const handleViewProject = (index) => {
    const project = connectionsData[index];
    setProjectData({
      ...project,
      daysLeft: Math.ceil((project.deadline - currentDate) / (1000 * 60 * 60 * 24)),
      percentageFunded: Math.round((project.balance / project.goal) * 100)
    });
    setShowProfilePopup(true);
  }

  const handleCloseProfile = () => {
    setShowProfilePopup(false);
    setProjectData(null);
  }

  return (
    <div>
      <div className="grid sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 w-[75%] mx-auto">
        {connectionsData.map((project, index) => {
          const daysLeft = Math.ceil((project.deadline - currentDate) / (1000 * 60 * 60 * 24));
          const percentageFunded = Math.round((project.balance / project.goal) * 100);
          const barWidth = Math.min(percentageFunded, 100);

          return (
            <div key={`connection-${index}`} className="flex flex-col items-center m-2">
              <a onClick={() => handleViewProject(index)} className="cursor-pointer bg-[#43444d] sm:w-100 md:w-67.5 lg:w-93.75 xl:w-78.75 2xl:w-100 h-full rounded-lg shadow-xl">
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

        {showProfilePopup && projectData && (
          <ProjectView projectData={projectData} onClose={handleCloseProfile}/>
      )}
    </div>
  )
}

export default ProjectGrid;
