import { useState } from "react";
import closeIcon from "../assets/close.svg";
import { ethers } from "ethers";
import { ESCROW_ABI } from "../contracts/EscrowContract";
import { connectWallet } from "../web3";

const ContributeView = ({ projectData, onClose, onContribute }) => {
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert("Please enter a valid amount greater than 0.");
      return;
    }

    if (!projectData.contractAddress) {
      alert("This project has no contract address. It may not have been deployed on-chain.");
      return;
    }

    setIsProcessing(true);
    try {
      const signer = await connectWallet();
      if (!signer) {
        alert("Please connect your MetaMask wallet.");
        return;
      }

      const contract = new ethers.Contract(
        projectData.contractAddress,
        ESCROW_ABI,
        signer
      );

      const valueInWei = ethers.parseEther(String(numAmount));
      alert("Sending contribution... Please confirm in MetaMask.");

      const tx = await contract.contribute({ value: valueInWei });
      await tx.wait();

      alert(`✅ Successfully contributed ${numAmount} ETH!`);
      onContribute(numAmount);

    } catch (err) {
      console.error("Contribution error:", err);
      alert("Contribution failed: " + (err.reason || err.message));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black bg-opacity-70">
      <div className="bg-[#43444d] rounded-xl w-full max-w-md p-8 text-white shadow-2xl border border-gray-500">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Back this project</h2>
          <button onClick={onClose} className="cursor-pointer p-1">
            <img src={closeIcon} className="w-6 h-6" alt="close" />
          </button>
        </div>

        <p className="mb-4 text-gray-300">
          Support <span className="font-semibold text-white">{projectData.title}</span>
        </p>

        {projectData.contractAddress && (
          <p className="mb-4 text-xs text-gray-400 font-mono break-all">
            Contract: {projectData.contractAddress}
          </p>
        )}

        <div className="space-y-4">
          <div className="form-group">
            <label className="block text-sm font-medium mb-2">Contribution Amount</label>
            <div className="relative flex items-center border-b-2 border-white">
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="bg-transparent py-2 outline-none w-full text-xl"
                autoFocus
              />
              <span className="ml-2 font-bold">ETH</span>
            </div>
          </div>
          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="w-full bg-[#028858] hover:bg-[#039260] py-3 rounded-lg font-bold transition-colors mt-4 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? "Processing..." : "Contribute"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContributeView;