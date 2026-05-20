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
const FACTORY_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; 

function App() {
  const { account, getSignerOrProvider } = useWallet(); // Added getSignerOrProvider here
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProjects = projects.filter((project) => 
    project && project.title && project.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Fetch all addresses dynamically from the Factory ─────────────────
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
          const balanceEth      = Number(ethers.formatEther(details._balance));
          const percentage      = fundingGoalEth > 0 ? (balanceEth / fundingGoalEth) * 100 : 0;
          
          const deadlineMs      = Number(details._deadline) * 1000;
          const daysLeftCalculated = Math.max(0, Math.ceil((deadlineMs - Date.now()) / (1000 * 60 * 60 * 24)));

          return {
            id: address, 
            contractAddress: address,
            title: details._title,
            owner: details._ownerName,
            description: details._description,
            goal: fundingGoalEth,
            balance: balanceEth,
            percentageFunded: Math.round(percentage),
            deadline: new Date(deadlineMs),
            daysLeft: daysLeftCalculated,
            creatorAddress: details._creator,
            banner: BannerImg
          };
        } catch (innerErr) {
          console.error(`Error reading individual project data at ${address}:`, innerErr);
          return null;
        }
      });

      const loadedProjects = await Promise.all(projectPromises);
      setProjects(loadedProjects.filter(p => p !== null));
    } catch (err) {
      console.error("Error reading factory data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockchainProjects();
  }, []);

  // ── Deploy New Project via Factory Contract ──────────────────────────
  const handleSaveProject = async (formData) => {
    if (!account) {
      alert("Please connect your wallet or log in manually first.");
      return;
    }

    setIsLoading(true);
    try {
      // FIX: Dynamically resolve either MetaMask signer or Hardhat manual Wallet
      const signerOrWallet = await getSignerOrProvider();
      
      // Connect to the deployed master factory instance using the resolved execution client
      const factoryContract = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signerOrWallet);

      const goalInWei = ethers.parseEther(formData.goal.toString());
      const deadlineTimestamp = Number(formData.deadline); 

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

  // ── Contribute Funds On-Chain ──────────────────────────────────────
  const handleContribute = async (contractAddress, amountEth) => {
    if (!account) {
      alert("Please connect your wallet or log in manually first.");
      return;
    }
    
    setIsLoading(true);
    try {
      // FIX: Dynamically resolve either MetaMask signer or Hardhat manual Wallet
      const signerOrWallet = await getSignerOrProvider();
      const contract = new ethers.Contract(contractAddress, ESCROW_ABI, signerOrWallet);

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

  return (
    <Routes>
      <Route element={<Layout onSearch={setSearchQuery} />}>
        <Route path="/" element = {
          <ProjectGrid 
            connectionsData={filteredProjects} 
            onSaveProject={handleSaveProject} 
            onContribute={handleContribute}
            isLoading={isLoading}
          />
        }/>
      </Route>
    </Routes>
  )
}

export default App;