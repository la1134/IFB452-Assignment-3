import { Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useWallet } from './components/WalletContext' // Consuming your custom context
import { ethers } from 'ethers'
import "./App.css"
import Layout from './components/Layout'
import ProjectGrid from './components/ProjectGrid'
import BannerImg from './assets/banner.jpg'

import { ESCROW_ABI } from './contracts/EscrowContract'
import { FACTORY_ABI } from './contracts/EscrowFactory'
import { MILESTONE_ABI } from './contracts/MilestoneContract'
import { MILESTONE_FACTORY_ABI } from './contracts/MilestoneFactory'
const FACTORY_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; 
const MILESTONE_FACTORY_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

function App() {
  const { account, getSignerOrProvider } = useWallet();
  const [projects, setProjects]                 = useState([]);
  const [milestoneAddresses, setMilestoneAddresses] = useState({}); // escrowAddress → milestoneAddress
  const [isLoading, setIsLoading]               = useState(false);
  const [searchQuery, setSearchQuery]           = useState("");

  const filteredProjects = projects.filter((project) =>
    project && project.title && project.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Fetch milestone address for each escrow ───────────────────────
  const fetchMilestones = async (escrowAddresses) => {
    try {
      const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      const factory = new ethers.Contract(MILESTONE_FACTORY_ADDRESS, MILESTONE_FACTORY_ABI, provider);

      const results = {};
      await Promise.all(
        escrowAddresses.map(async (addr) => {
          try {
            const milestone = await factory.getMilestoneForEscrow(addr);
            if (milestone !== ethers.ZeroAddress) results[addr] = milestone;
          } catch (err) {
            console.error(`Error fetching milestone for ${addr}:`, err);
          }
        })
      );
      setMilestoneAddresses(results);
    } catch (err) {
      console.error("Error fetching milestones:", err);
    }
  };

  // ── Fetch all escrow projects from factory ────────────────────────
  const fetchBlockchainProjects = async () => {
    setIsLoading(true);
    try {
      const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      const factoryContract = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);

      const contractAddresses = await factoryContract.getAllEscrows();

      const projectPromises = contractAddresses.map(async (address) => {
        try {
          const contract = new ethers.Contract(address, ESCROW_ABI, provider);
          const details = await contract.getProjectDetails();

          const fundingGoalEth = Number(ethers.formatEther(details._fundingGoal));
          const balanceEth     = Number(ethers.formatEther(details._balance));
          const percentage     = fundingGoalEth > 0 ? (balanceEth / fundingGoalEth) * 100 : 0;

          const deadlineMs         = Number(details._deadline) * 1000;
          const daysLeftCalculated = Math.max(0, Math.ceil((deadlineMs - Date.now()) / (1000 * 60 * 60 * 24)));

          return {
            id:               address,
            contractAddress:  address,
            title:            details._title,
            owner:            details._ownerName,
            description:      details._description,
            goal:             fundingGoalEth,
            balance:          balanceEth,
            percentageFunded: Math.round(percentage),
            deadline:         new Date(deadlineMs),
            daysLeft:         daysLeftCalculated,
            creatorAddress:   details._creator,
            banner:           BannerImg,
          };
        } catch (innerErr) {
          console.error(`Error reading project at ${address}:`, innerErr);
          return null;
        }
      });

      const loadedProjects = await Promise.all(projectPromises);
      const validProjects  = loadedProjects.filter(p => p !== null);

      setProjects(validProjects);

      // Fetch milestone contracts for all loaded escrows
      if (contractAddresses.length > 0) {
        await fetchMilestones(contractAddresses);
      }
    } catch (err) {
      console.error("Error reading factory data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockchainProjects();
  }, []);

  // ── Deploy New Escrow via Factory ─────────────────────────────────
  const handleSaveProject = async (formData) => {
  if (!account) {
    alert("Please connect your wallet or log in manually first.");
    return;
  }
  setIsLoading(true);
  try {
    const signerOrWallet  = await getSignerOrProvider();
    const factoryContract = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signerOrWallet);
    const goalInWei       = ethers.parseEther(formData.goal.toString());

    // formData.deadline is already a Unix timestamp (seconds) from EditView — use it directly
    const deadlineTimestamp = formData.deadline;

    const tx = await factoryContract.createEscrow(
      goalInWei,
      deadlineTimestamp,
      formData.title,
      formData.owner,
      formData.description
    );
    await tx.wait();
    await fetchBlockchainProjects();
  } catch (err) {
    console.error("Factory execution failure:", err);
    alert("Error: " + (err.reason ?? err.message));
    throw err;
  } finally {
    setIsLoading(false);
  }
};

  // ── Contribute to Escrow ──────────────────────────────────────────
  const handleContribute = async (contractAddress, amountEth) => {
    if (!account) {
      alert("Please connect your wallet or log in manually first.");
      return;
    }
    setIsLoading(true);
    try {
      const signerOrWallet = await getSignerOrProvider();
      const contract       = new ethers.Contract(contractAddress, ESCROW_ABI, signerOrWallet);

      const tx = await contract.contribute({
        value: ethers.parseEther(amountEth.toString())
      });
      await tx.wait();
      await fetchBlockchainProjects();
    } catch (err) {
      console.error("Transaction failed:", err);
      alert("Transaction error: " + (err.reason ?? err.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleMilestoneContribute = async (milestoneAddress, roundId, amountEth) => {
    if (!account) {
      alert("Please connect your wallet first.");
      return;
    }
    setIsLoading(true);
    try {
      const signer = await getSignerOrProvider();
      const contract = new ethers.Contract(milestoneAddress, MILESTONE_ABI, signer);
      
      // Call the contribute function on the Milestone contract
      const tx = await contract.contribute(roundId, { 
        value: ethers.parseEther(amountEth.toString()) 
      });
      
      await tx.wait();
      
      // Refresh the main projects list (to update balance/milestone status)
      await fetchBlockchainProjects();
      
      return true; // Indicate success
    } catch (err) {
      console.error("Milestone contribution failed:", err);
      alert("Contribution failed: " + (err.reason ?? err.message));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // ── Deploy Milestone Contract via MilestoneFactory ────────────────
  const handleDeployMilestone = async (escrowAddress) => {
    if (!account) {
      alert("Please connect your wallet first.");
      return;
    }
    try {
      const signerOrWallet = await getSignerOrProvider();
      const factory        = new ethers.Contract(MILESTONE_FACTORY_ADDRESS, MILESTONE_FACTORY_ABI, signerOrWallet);

      const tx = await factory.createMilestone(escrowAddress);
      await tx.wait();

      // Refresh just this escrow's milestone mapping
      await fetchMilestones([escrowAddress]);
    } catch (err) {
      console.error("Milestone deployment failed:", err);
      alert("Milestone deployment failed: " + (err.reason ?? err.message));
      throw err;
    }
  };

  return (
    <Routes>
      <Route element={<Layout onSearch={setSearchQuery} />}>
        <Route path="/" element={
          <ProjectGrid
            connectionsData={filteredProjects}
            onSaveProject={handleSaveProject}
            onContribute={handleContribute}
            onMilestoneContribute={handleMilestoneContribute}
            onDeployMilestone={handleDeployMilestone}
            milestoneAddresses={milestoneAddresses}
            isLoading={isLoading}
          />
        }/>
      </Route>
    </Routes>
  );
}

export default App;