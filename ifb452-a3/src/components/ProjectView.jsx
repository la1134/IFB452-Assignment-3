import { ethers } from "ethers";
import { useState, useEffect } from "react";
import closeIcon from "../assets/close.svg";
import timeIcon from "../assets/time.svg";
import { useWallet } from "./WalletContext";
import { ESCROW_ABI } from "../contracts/EscrowContract";

const ProjectView = ({ projectData, onClose, onEdit, onDelete, onBackClick }) => {
  const { account, getSignerOrProvider } = useWallet();
  const [myContribution, setMyContribution] = useState(0n);
  const [secondsLeftOnChain, setSecondsLeftOnChain] = useState(null);
  const [isWithdrawnOnChain, setIsWithdrawnOnChain] = useState(false); // Track if creator already took the funds
  const [isSubmitting, setIsSubmitting] = useState(false);

  const barWidth       = Math.min(projectData.percentageFunded, 100);
  const goalMet        = projectData.balance >= projectData.goal;
  const hasContract    = !!projectData.contractAddress;

  const deadlinePassed = secondsLeftOnChain !== null 
    ? secondsLeftOnChain === 0 
    : new Date(projectData.deadline) < new Date();

  const displayDaysLeft = secondsLeftOnChain !== null
    ? Math.ceil(secondsLeftOnChain / (24 * 60 * 60))
    : projectData.daysLeft;

  useEffect(() => {
    if (!hasContract || !window.ethereum) return;

    async function fetchContractState() {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(projectData.contractAddress, ESCROW_ABI, provider);
        
        // Fetch contract details from deployment
        const [amount, remainingSeconds, withdrawnStatus] = await Promise.all([
          account ? contract.contributions(account) : Promise.resolve(0n),
          contract.timeRemaining(),
          contract.withdrawn()
        ]);

        setMyContribution(amount);
        setSecondsLeftOnChain(Number(remainingSeconds));
        setIsWithdrawnOnChain(withdrawnStatus);
      } catch (err) {
        console.error("Could not fetch contract state:", err);
      }
    }

    fetchContractState();
  }, [account, projectData.contractAddress, hasContract]);

  const isCreator =
    account &&
    projectData.creatorAddress &&
    account.toLowerCase() === projectData.creatorAddress.toLowerCase();

  const isBacker = account && !isCreator;

  // Contract helper
  async function getEscrowContract() {
    if (!hasContract) throw new Error("No contract address on this project.");
    const client = await getSignerOrProvider(); // Handles MetaMask OR Hardhat key
    return new ethers.Contract(projectData.contractAddress, ESCROW_ABI, client);
  }

  const handleFund = () => {
    if (!hasContract) {
      alert("This project has no contract address.");
      return;
    }
    onBackClick();
  };

  const handleRefund = async () => {
    setIsSubmitting(true);
    try {
      const contract = await getEscrowContract();
      const tx = await contract.refund();
      await tx.wait();
      alert("Refund successful!");
      setMyContribution(0n); // Instantly zero out local state
    } catch (err) {
      console.error(err);
      alert("Refund failed: " + (err.reason ?? err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    setIsSubmitting(true);
    try {
      const contract = await getEscrowContract();
      const tx = await contract.withdraw();
      await tx.wait();
      alert("Withdrawal successful!");
      setIsWithdrawnOnChain(true); // Disable button instantly
    } catch (err) {
      console.error(err);
      alert("Withdrawal failed: " + (err.reason ?? err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Delete "${projectData.title}"? This cannot be undone.`)) {
      onDelete(projectData.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-[#43444d] rounded-xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col">

        {/* Top bar */}
        <div className="flex justify-end items-center p-4 border-b border-gray-600">
          <button onClick={onClose} className="cursor-pointer p-2 rounded-full">
            <img src={closeIcon} className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto">
          <img
            src={projectData.banner}
            alt="Profile Banner"
            className="w-full h-75 object-cover object-[0%_20%]"
          />

          <div className="text-left py-4 px-16 text-white">
            <h1 className="text-4xl py-4 font-semibold">{projectData.title}</h1>
            <h2 className="text-lg pb-6 text-gray-200">{projectData.owner}</h2>

            {/* No contract warning */}
            {!hasContract && (
              <div className="bg-yellow-900/40 border border-yellow-600/50 rounded-lg px-4 py-2 mb-4 text-yellow-300 text-sm">
                ⚠ This project has no contract address. It may not have been deployed on-chain.
              </div>
            )}

            {/* Stats row */}
            <div className="flex justify-start gap-x-20">
              <div className="flex items-center gap-x-1">
                <img src={timeIcon} className="w-8 h-8 pt-1 opacity-80" />
                <p className="text-xl text-gray-100">
                  {deadlinePassed ? "Expired" : `${displayDaysLeft.toLocaleString()} days left`}
                </p>
              </div>
              <div className="flex items-center gap-x-4">
                <div className="min-w-75 w-full h-4 bg-white/20 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-green-500 transition-all duration-500 ease-out"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <p className="min-w-100 text-xl text-gray-100">
                  {projectData.balance?.toLocaleString()}/{projectData.goal?.toLocaleString()} ETH — ({projectData.percentageFunded?.toLocaleString()}% funded)
                </p>
              </div>
            </div>
            
            {/* User Personal Stake Display */}
            {myContribution > 0n && (
              <div className="bg-green-900/30 border border-green-600/40 rounded-lg px-4 py-2 mt-4 text-green-300 text-sm w-fit">
                🤝 Your Total Contribution: {ethers.formatEther(myContribution)} ETH
              </div>
            )}

            <p className="text-gray-200 pt-8">{projectData.description}</p>
          </div>
        </div>

        {/* ── Footer Actions ────────────────────────────────────────────── */}
        <div className="flex justify-start py-6 px-16 gap-x-4 border-t border-gray-600">

          {!account && (
            <p className="text-gray-400 text-sm self-center">Login to fund this project.</p>
          )}

          {/* BACKER ACTIONS */}
          {isBacker && !deadlinePassed && (
            <button
              onClick={handleFund}
              disabled={isSubmitting}
              className="bg-[#028858] text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-[#039260] transition-colors disabled:opacity-50"
            >
              Back this project
            </button>
          )}

          {isBacker && deadlinePassed && !goalMet && myContribution > 0n && (
            <button
              onClick={handleRefund}
              disabled={isSubmitting}
              className="bg-red-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Processing..." : "Claim Refund"}
            </button>
          )}

          {/* CREATOR ACTIONS */}
          {isCreator && deadlinePassed && goalMet && !isWithdrawnOnChain && (
            <button
              onClick={handleWithdraw}
              disabled={isSubmitting}
              className="bg-[#028858] text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-[#039260] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Processing..." : "Withdraw Funds"}
            </button>
          )}

          {isCreator && deadlinePassed && goalMet && isWithdrawnOnChain && (
            <p className="text-gray-400 text-sm self-center italic">🎉 Project funds successfully withdrawn to your wallet.</p>
          )}

          {isCreator && !hasContract && (
            <>
              <button
                onClick={() => { onEdit(projectData); onClose(); }}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-gray-500 transition-colors"
              >
                Edit Project
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-red-700 transition-colors"
              >
                Delete Project
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default ProjectView;