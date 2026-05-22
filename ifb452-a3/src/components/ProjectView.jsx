import { ethers } from "ethers";
import { useState, useEffect } from "react";
import { useWallet } from "./WalletContext";
import { ESCROW_ABI } from "../contracts/EscrowContract";
import closeIcon from "../assets/close.svg";
import timeIcon from "../assets/time.svg";
import MilestoneView from "./MilestoneView";

const ProjectView = ({ projectData, onClose, onEdit, onBackClick, onDeployMilestone, onMilestoneContribute, milestoneAddress }) => {

  // Default project variables, useState for dynamic rendering
  const { account, getSignerOrProvider } = useWallet();
  const [myContribution, setMyContribution]         = useState(0n);
  const [secondsLeftOnChain, setSecondsLeftOnChain] = useState(null);
  const [isWithdrawnOnChain, setIsWithdrawnOnChain] = useState(false);
  const [goalWasMet, setGoalWasMet]                 = useState(false);
  const [isSubmitting, setIsSubmitting]             = useState(false);
  const [showMilestonePopup, setShowMilestonePopup] = useState(false);

  const barWidth    = Math.min(projectData.percentageFunded, 100);
  const hasContract = !!projectData.contractAddress;

  const deadlinePassed = secondsLeftOnChain !== null
    ? secondsLeftOnChain === 0
    : new Date(projectData.deadline) < new Date();

  const displayDaysLeft = secondsLeftOnChain !== null
    ? Math.ceil(secondsLeftOnChain / (24 * 60 * 60))
    : projectData.daysLeft;

  // Uses goalWasMet for persiststance after withdrawal drains balance
  const goalMet = goalWasMet || projectData.balance >= projectData.goal;

  const hasMilestone = !!milestoneAddress;

  // Get data from Escrow contracts using ethers
  useEffect(() => {
    if (!hasContract || !window.ethereum) return;

    async function fetchContractState() {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(projectData.contractAddress, ESCROW_ABI, provider);

        const [amount, remainingSeconds, withdrawnStatus, goalWasMetStatus] = await Promise.all([
          account ? contract.contributions(account) : Promise.resolve(0n),
          contract.timeRemaining(),
          contract.withdrawn(),
          contract.goalWasMet(),
        ]);

        setMyContribution(amount);
        setSecondsLeftOnChain(Number(remainingSeconds));
        setIsWithdrawnOnChain(withdrawnStatus);
        setGoalWasMet(goalWasMetStatus);
      } catch (err) {
        console.error("Could not fetch contract state:", err);
      }
    }

    fetchContractState();
  }, [account, projectData.contractAddress, hasContract]);

  // Determining stakeholder roles
  const isCreator =
    account &&
    projectData.creatorAddress &&
    account.toLowerCase() === projectData.creatorAddress.toLowerCase();

  const isBacker = account && !isCreator;

  async function getEscrowContract() {
    if (!hasContract) throw new Error("No contract address on this project.");
    const client = await getSignerOrProvider();
    return new ethers.Contract(projectData.contractAddress, ESCROW_ABI, client);
  }

  const handleFund = () => {
    if (!hasContract) { alert("This project has no contract address."); return; }
    onBackClick();
  };

  // Calls refund function from Escrow contract
  const handleRefund = async () => {
    setIsSubmitting(true);
    try {
      const contract = await getEscrowContract();
      const tx = await contract.refund();
      await tx.wait();
      alert("Refund successful!");
      setMyContribution(0n);
    } catch (err) {
      alert("Refund failed: " + (err.reason ?? err.message));
    } finally { setIsSubmitting(false); }
  };

  // Same for withdrawal
  const handleWithdraw = async () => {
    setIsSubmitting(true);
    try {
      const contract = await getEscrowContract();
      const tx = await contract.withdraw();
      await tx.wait();
      alert("Withdrawal successful!");
      setIsWithdrawnOnChain(true);
      setGoalWasMet(true); // reflects immediately without refresh
    } catch (err) {
      alert("Withdrawal failed: " + (err.reason ?? err.message));
    } finally { setIsSubmitting(false); }
  };

  const handleDeployMilestone = async () => {
    setIsSubmitting(true);
    try {
      await onDeployMilestone(projectData.contractAddress);
    } catch (err) {
      alert("Milestone deployment failed: " + (err.reason ?? err.message));
    } finally { setIsSubmitting(false); }
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

            {!hasContract && (
              <div className="bg-yellow-900/40 border border-yellow-600/50 rounded-lg px-4 py-2 mb-4 text-yellow-300 text-sm">
                ⚠ This project has no contract address. It may not have been deployed on-chain.
              </div>
            )}

            {/* Stats row */}
            <div className="flex justify-start gap-x-4 xl:gap-x-20">
              <div className="flex items-center gap-x-1">
                <img src={timeIcon} className="w-8 h-8 pt-1 opacity-80" />
                <p className="min-w-30 text-md xl:text-xl text-gray-100">
                  {deadlinePassed ? "Expired" : `${displayDaysLeft.toLocaleString()} days left`}
                </p>
              </div>

              <div className="flex items-center gap-x-4">
                {hasMilestone ? (
                  // Display this when hasMilestone is true
                  <div className="min-w-75 h-10 flex items-center justify-center bg-green-900/40 border border-green-600/50 rounded-lg px-4">
                    <span className="text-green-300 font-bold">Funded</span>
                  </div>
                ) : (
                  // Existing progress bar display
                  <>
                    <div className="min-w-20 sm:min-w-50 md:min-w-75 w-full h-4 bg-white/20 rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full bg-green-500 transition-all duration-500 ease-out"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <p className="min-w-100 text-md xl:text-xl text-gray-100">
                      {projectData.balance?.toLocaleString()}/{projectData.goal?.toLocaleString()} ETH — ({projectData.percentageFunded?.toLocaleString()}% funded)
                    </p>
                  </>
                )}
              </div>

            </div>

            {myContribution > 0n && (
              <div className="bg-yellow-900/30 border border-yellow-600/40 rounded-lg px-4 py-2 mt-4 text-yellow-300 text-sm w-fit">
                Your Total Contribution: {ethers.formatEther(myContribution)} ETH
              </div>
            )}

            {/* Milestone badge */}
            {hasMilestone && (
              <div className="mt-6 bg-blue-900/20 border border-blue-600/30 rounded-lg px-4 py-3">
                <p className="text-blue-300 text-sm font-semibold uppercase tracking-wider mb-1">Now Running Milestones Rounds</p>
              </div>
            )}

            <p className="text-gray-200 pt-8">{projectData.description}</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-start py-6 px-16 gap-x-4 border-t border-gray-600">

          {!account && (
            <p className="text-gray-400 text-sm self-center">Login to fund this project.</p>
          )}

          {/* BACKER ACTIONS */}
          {isBacker && !deadlinePassed && (
            <button onClick={handleFund} disabled={isSubmitting}
              className="bg-[#028858] text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-[#039260] transition-colors disabled:opacity-50">
              Back this project
            </button>
          )}

          {isBacker && deadlinePassed && !goalMet && myContribution > 0n && (
            <button onClick={handleRefund} disabled={isSubmitting}
              className="bg-red-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-red-700 transition-colors disabled:opacity-50">
              {isSubmitting ? "Processing..." : "Claim Refund"}
            </button>
          )}

          {isBacker && hasMilestone && (
            <button onClick={() => setShowMilestonePopup(true)} disabled={isSubmitting}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors disabled:opacity-50">
              View Milestones
            </button>
          )}

          {/* CREATOR ACTIONS */}
          {isCreator && deadlinePassed && goalMet && !isWithdrawnOnChain && (
            <button onClick={handleWithdraw} disabled={isSubmitting}
              className="bg-[#028858] text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-[#039260] transition-colors disabled:opacity-50">
              {isSubmitting ? "Processing..." : "Withdraw Funds"}
            </button>
          )}

          {isCreator && deadlinePassed && goalMet && !isWithdrawnOnChain && (
            <p className="text-gray-400 text-sm self-center italic">
              Withdraw funds first to unlock milestone deployment.
            </p>
          )}

          {isCreator && deadlinePassed && goalMet && isWithdrawnOnChain && !hasMilestone && (
            <button onClick={handleDeployMilestone} disabled={isSubmitting}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-purple-700 transition-colors disabled:opacity-50">
              {isSubmitting ? "Deploying..." : "Deploy Milestone Contract"}
            </button>
          )}

          {isCreator && hasMilestone && (
            <button onClick={() => setShowMilestonePopup(true)} disabled={isSubmitting}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors disabled:opacity-50">
              Manage Milestones
            </button>
          )}

          {isCreator && deadlinePassed && goalMet && isWithdrawnOnChain && hasMilestone && (
            <p className="text-gray-400 text-sm self-center italic">Funds withdrawn. Milestone contract active.</p>
          )}

        </div>
      </div>

      {showMilestonePopup && (
        <MilestoneView
          projectData={projectData}
          milestoneAddress={milestoneAddress}
          isCreator={isCreator}
          onMilestoneContribute={onMilestoneContribute}
          onClose={() => setShowMilestonePopup(false)}
        />
      )}
    </div>
  );
};

export default ProjectView;