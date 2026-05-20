import { useState, useEffect } from 'react';
import ProjectView from './ProjectView';
import EditView from './EditView';
import LoginView from './LoginView';
import timeIcon from "../assets/time.svg";
import plusIcon from "../assets/plus.svg";
import LoadingSpinner from './LoadingSpinner';
import ContributeView from './ContributeView';
import { useWallet } from './WalletContext';
import { ethers } from "ethers";
import { ESCROW_ABI } from '../contracts/EscrowContract';

const ProjectGrid = ({ connectionsData, onSaveProject, onContribute, onDelete, isLoading }) => {
  const { account } = useWallet();

  const [projectData,         setProjectData]         = useState(null);
  const [showProfilePopup,   setShowProfilePopup]   = useState(false);
  const [showEditPopup,      setShowEditPopup]       = useState(false);
  const [showContributePopup,setShowContributePopup] = useState(false);
  const [showLoginPopup,     setShowLoginPopup]      = useState(false);
  const [editingProject,     setEditingProject]      = useState(null);

  const [activeTab, setActiveTab] = useState("all");
  const [chainTimes, setChainTimes] = useState({});

  useEffect(() => {
    const fetchAllTimes = async () => {
      if (!window.ethereum) return;
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      const newTimes = {};
      await Promise.all(
        connectionsData.map(async (project) => {
          if (project.contractAddress) {
            try {
              const contract = new ethers.Contract(project.contractAddress, ESCROW_ABI, provider);
              const remaining = await contract.timeRemaining();
              newTimes[project.id] = Number(remaining);
            } catch (err) {
              console.error(`Error fetching time for ${project.id}:`, err);
            }
          }
        })
      );
      setChainTimes(newTimes);
    };

    fetchAllTimes();
  }, [connectionsData]);
  
  // Tab Filtering
  const filteredProjects = connectionsData.filter((project) => {
    if (!project) return false;

    const secondsLeft = chainTimes[project.id];
    const isExpired = secondsLeft !== undefined ? secondsLeft === 0 : new Date(project.deadline) < new Date();
    const isEmpty = (project.balance ?? 0) === 0;
    if (isExpired && isEmpty) return false;
    
    if (activeTab === "funded") {
      // Find if user funded
      return project.contributionBalance > 0;
    }
    
    if (activeTab === "created") {
      // Find if user creator
      return project.creatorAddress?.toLowerCase() === account?.toLowerCase();
    }
    
    return true;
  });

  const handleViewProject = (project) => {
    setProjectData(project);
    setShowProfilePopup(true);
  };

  const handleEditProject = (project = null) => {
    setEditingProject(project);
    setShowEditPopup(true);
  };

  const handleCloseProfile = () => {
    setShowProfilePopup(false);
    setProjectData(null);
  };

  const handleCloseEdit = () => {
    setShowEditPopup(false);
    setEditingProject(null);
  };

  const handleOpenContribute = () => {
    setShowContributePopup(true);
  };

  const handleCreateClick = () => {
    if (!account) {
      setShowLoginPopup(true);
    } else {
      handleEditProject(null);
    }
  };

  return (
    <div>
      {/* Create Button */}
      <button
        className="flex items-center gap-2 bg-[#028858] text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-[#039260] transition-colors mx-auto"
        onClick={handleCreateClick}
      >
        <img src={plusIcon} alt="Plus" className="w-5 h-5" />
        <span>Create New Project</span>
      </button>

      {/* Tabs Layout */}
      <div className="flex items-center justify-center pt-8">
        {[
          { key: "all",     label: "All Projects" },
          { key: "funded",  label: "Projects I've Funded" },
          { key: "created", label: "Projects I've Created" },
        ].map(({ key, label }, index, arr) => (
          <div key={key} className="flex items-center">
            <button
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 text-md font-medium transition-colors cursor-pointer ${
                activeTab === key ? "text-white" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {label}
            </button>
            {index < arr.length - 1 && (
              <span className="text-gray-500 select-none">|</span>
            )}
          </div>
        ))}
      </div>

      <div className="pt-6">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 w-[75%] mx-auto">
            {filteredProjects.map((project) => {

              // Calculate time left
              const secondsLeft = chainTimes[project.id];
              const daysLeft = secondsLeft !== undefined 
                ? Math.ceil(secondsLeft / (24 * 60 * 60)) 
                : (project.daysLeft ?? 0);
              const percentageFunded = project.percentageFunded ?? 0;
              const barWidth = Math.min(percentageFunded, 100);

              return (
                <div key={project.id} className="flex flex-col items-center m-2">
                  <a
                    onClick={() => handleViewProject(project)}
                    className="cursor-pointer bg-[#43444d] sm:w-100 md:w-67.5 lg:w-93.75 xl:w-78.75 2xl:w-100 h-full rounded-lg shadow-xl"
                  >
                    <img
                      src={project.banner}
                      alt="Profile Banner"
                      className="w-full h-50 object-cover object-[0%_20%] rounded-t-lg"
                    />
                    <div>
                      <div className="flex flex-col items-center py-4 text-white">
                        <h2 className="text-center text-xl font-semibold">{project.title}</h2>
                        <p className="text-center text-xs px-6 pb-4 text-gray-300">{project.owner}</p>
                        <div className="flex items-center justify-between w-full px-16 gap-x-6">

                          <div className="flex items-center gap-x-1 shrink-0">
                            <img src={timeIcon} className="w-3.5 h-3.5 opacity-80" />
                            <p className="text-sm font-semibold text-gray-200 whitespace-nowrap">
                              {daysLeft.toLocaleString()} days
                            </p>
                          </div>

                          <div className="flex items-center gap-x-2 flex-1">
                            <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 transition-all duration-500 ease-out"
                                style={{ width: `${barWidth}%` }}
                              />
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
          onEdit={(project) => {
            handleEditProject(project);
            handleCloseProfile();
          }}
          onDelete={onDelete}
          onBackClick={handleOpenContribute}
        />
      )}

      {showEditPopup && (
        <EditView
          projectData={editingProject}
          onClose={handleCloseEdit}
          onSaveProject={async (data) => {
              await onSaveProject(data);
              handleCloseEdit();
          }}
        />
      )}

      {showContributePopup && projectData && (
        <ContributeView
          projectData={projectData}
          onClose={() => setShowContributePopup(false)}
          onContribute={(contractAddress, amount) => {
            onContribute(contractAddress, amount); 
            setShowContributePopup(false);
            handleCloseProfile();
          }}
        />
      )}

      {showLoginPopup && (
        <LoginView
          onClose={() => setShowLoginPopup(false)}
          onSuccess={() => {
            setShowLoginPopup(false);
            handleEditProject(null);
          }}
        />
      )}

    </div>
  );
};

export default ProjectGrid;