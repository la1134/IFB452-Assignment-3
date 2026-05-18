import closeIcon from "../assets/close.svg"
import timeIcon from "../assets/time.svg"
import { ethers } from "ethers"
import { ESCROW_ABI } from "../contracts/EscrowContract"
import { connectWallet } from "../web3"
import { useWallet } from "./WalletContext"

const ProjectView = ({ projectData, onClose, onEdit, onBackClick, onDelete }) => {
  const barWidth = Math.min(projectData.percentageFunded, 100);
  const { account } = useWallet();

  const isCreator = account &&
    projectData.contractAddress &&
    account.toLowerCase() === projectData.creatorAddress?.toLowerCase();

  const handleWithdraw = async () => {
    try {
      const signer = await connectWallet();
      const contract = new ethers.Contract(
        projectData.contractAddress,
        ESCROW_ABI,
        signer
      );
      alert("Withdrawing funds... Please confirm in MetaMask.");
      const tx = await contract.withdraw();
      await tx.wait();
      alert("✅ Funds withdrawn successfully!");
      onClose();
    } catch (err) {
      console.error("Withdraw error:", err);
      alert("Withdraw failed: " + (err.reason || err.message));
    }
  };

  const handleRefund = async () => {
    try {
      const signer = await connectWallet();
      const contract = new ethers.Contract(
        projectData.contractAddress,
        ESCROW_ABI,
        signer
      );
      alert("Claiming refund... Please confirm in MetaMask.");
      const tx = await contract.refund();
      await tx.wait();
      alert("✅ Refund claimed successfully!");
      onClose();
    } catch (err) {
      console.error("Refund error:", err);
      alert("Refund failed: " + (err.reason || err.message));
    }
  };

  const handleDelete = () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project? This cannot be undone."
    );
    if (confirmed) {
      onDelete(projectData.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-[#43444d] rounded-xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-end items-center p-4 border-b">
          <button onClick={onClose} className="cursor-pointer p-2 rounded-full">
            <img src={closeIcon} className="w-6 h-6"/>
          </button>
        </div>
        <div className="overflow-y-auto">
          <img
            src={projectData.banner}
            alt="Profile Banner"
            className="w-full h-75 object-cover object-[0%_20%] rounded-t-lg"
          />
          <div className="text-left py-4 px-16 text-white">
            <h1 className="text-4xl py-4 font-semibold">{projectData.title}</h1>
            <h2 className="text-lg pb-6 text-gray-200">{projectData.owner}</h2>
            <div className="flex justify-start gap-x-20">
              <div className="flex items-center gap-x-1">
                <img src={timeIcon} className="w-8 h-8 pt-1 opacity-80"/>
                <p className="text-xl text-gray-100">{projectData.daysLeft.toLocaleString()} days left</p>
              </div>
              <div className="flex items-center gap-x-4">
                <div className="min-w-75 w-full h-4 bg-white/20 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-green-500 transition-all duration-500 ease-out"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <p className="min-w-100 text-xl text-gray-100">
                  {projectData.balance.toLocaleString()}/{projectData.goal.toLocaleString()} ETH - ({projectData.percentageFunded.toLocaleString()}% funded)
                </p>
              </div>
            </div>
            <p className="text-gray-200 pt-8">{projectData.description}</p>
          </div>
        </div>

        <div className="flex justify-between py-6 px-16">
          <div className="flex gap-x-6">
            {/* Backer buttons */}
            {!isCreator && (
              <>
                <button
                  className="bg-[#028858] text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-[#039260]"
                  onClick={onBackClick}
                >
                  Back this project
                </button>
                {projectData.daysLeft <= 0 && projectData.percentageFunded < 100 && (
                  <button
                    className="bg-red-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-red-500"
                    onClick={handleRefund}
                  >
                    Claim Refund
                  </button>
                )}
              </>
            )}

            {/* Creator buttons */}
            {isCreator && (
              <>
                {projectData.percentageFunded >= 100 && (
                  <button
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-blue-500"
                    onClick={handleWithdraw}
                  >
                    Withdraw Funds
                  </button>
                )}
                <button
                  onClick={onEdit}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-gray-500"
                >
                  Edit Project
                </button>
              </>
            )}
          </div>

          {/* Delete button — creator only, right side */}
          {isCreator && (
            <button
              onClick={handleDelete}
              className="bg-red-700 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-red-600"
            >
              Delete Project
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectView;