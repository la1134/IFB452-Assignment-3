import { useState } from "react";
import closeIcon from "../assets/close.svg";
import { useWallet } from "./WalletContext";

const LoginView = ({ onClose, onSuccess }) => {
  const { connect, loginManual } = useWallet();

  const [walletAddress, setWalletAddress] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // MetaMask login
  const handleMetaMask = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const signer = await connect();
      if (signer) onSuccess();
    } catch (err) {
      console.error("MetaMask connection failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manual login
  const handleManual = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const cleanAddress = walletAddress.trim();
    const cleanKey = privateKey.trim();

    if (!cleanAddress || !cleanKey) {
      alert("Please fill in both fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const wallet = await loginManual(cleanAddress, cleanKey);
      if (wallet) onSuccess();
    } catch (err) {
      console.error("Manual login validation failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-70 p-4">
      <div className="bg-[#43444d] rounded-xl w-full max-w-md p-8 text-white shadow-2xl">

        {/* Top Header */}
        <div className="flex justify-between mb-6">
          <h2 className="text-2xl font-medium">Login</h2>
          <button 
            onClick={onClose} 
            disabled={isSubmitting} 
            className="hover:cursor-pointer disabled:opacity-30"
          >
            <img src={closeIcon} className="w-6 h-6" alt="Close" />
          </button>
        </div>

        {/* MetaMask Login */}
        <button
          onClick={handleMetaMask}
          disabled={isSubmitting}
          className="w-full bg-[#028858] hover:bg-[#039260] py-3 rounded-lg my-2 font-bold hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "Connecting..." : "Connect MetaMask Wallet"}
        </button>

        {/* Visual Separator */}
        <div className="relative flex items-center my-6">
          <div className="grow border-t border-gray-500"></div>
          <span className="shrink mx-4 text-gray-400 text-sm font-medium tracking-wider">OR</span>
          <div className="grow border-t border-gray-500"></div>
        </div>

        {/* Hardhat / Local Node Credentials Form */}
        <form onSubmit={handleManual} className="space-y-5">
          <div className="form-group">
            <label className="block text-sm font-medium mb-1 text-gray-300">Wallet Address</label>
            <div className="relative flex items-center border-b-2 border-white focus-within:border-green-500 transition-colors">
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x000000000000..."
                disabled={isSubmitting}
                className="bg-transparent py-2 outline-none w-full text-lg placeholder-gray-500 disabled:opacity-50"
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label className="block text-sm font-medium mb-1 text-gray-300">Private Key</label>
            <div className="relative flex items-center border-b-2 border-white focus-within:border-green-500 transition-colors">
              <input
                type="password"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="••••••••••••••••••••••••"
                disabled={isSubmitting}
                className="bg-transparent py-2 outline-none w-full text-lg placeholder-gray-500 disabled:opacity-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gray-600 hover:bg-gray-500 py-3 rounded-lg font-bold hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
          >
            {isSubmitting ? "Verifying On-Chain..." : "Login Manually"}
          </button>
        </form>

      </div>
    </div>
  );
};

export default LoginView;