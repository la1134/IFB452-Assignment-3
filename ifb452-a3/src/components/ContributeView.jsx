import { useState } from "react";
import closeIcon from "../assets/close.svg";
import { useWallet } from "./WalletContext";

const ContributeView = ({ projectData, onClose, onContribute }) => {
  const [amount, setAmount] = useState("");
  const [isSending, setIsSending] = useState(false);

  const hasContract = !!projectData.contractAddress;

  // Use onContribute parent function to send ETH from backer
  const handleConfirm = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert("Please enter a valid amount greater than 0.");
      return;
    }

    setIsSending(true);
    await onContribute(projectData.contractAddress, numAmount);
    setIsSending(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black bg-opacity-70">
      <div className="bg-[#43444d] rounded-xl w-full max-w-md p-8 text-white shadow-2xl border border-gray-500">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Back this project</h2>
          <button onClick={onClose} className="cursor-pointer p-1 disabled:opacity-30" disabled={isSending}>
            <img src={closeIcon} className="w-6 h-6" alt="close" />
          </button>
        </div>

        <p className="mb-4 text-gray-300">
          Support <span className="font-semibold text-white">{projectData.title}</span>
        </p>

        {!hasContract && (
          <div className="bg-yellow-900/40 border border-yellow-600/50 rounded-lg px-4 py-2 mb-4 text-yellow-300 text-xs">
            ⚠ No contract deployed — contribution will only update the local database.
          </div>
        )}

        <div className="space-y-4">
          <div className="form-group">
            <label className="block text-sm font-medium mb-2 text-gray-300">Contribution Amount</label>
            <div className="relative flex items-center border-b-2 border-white focus-within:border-green-500 transition-colors">
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="bg-transparent py-2 outline-none w-full text-xl disabled:opacity-50"
                autoFocus
                disabled={isSending}
              />
              <span className="ml-2 font-bold">ETH</span>
            </div>
          </div>

          <button
            onClick={handleConfirm}
            disabled={isSending}
            className="w-full bg-[#028858] hover:bg-[#039260] disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-lg font-bold transition-colors mt-4 cursor-pointer"
          >
            {isSending ? "Sending transaction…" : "Contribute"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContributeView;