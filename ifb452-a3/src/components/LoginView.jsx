import { useState } from "react";
import closeIcon from "../assets/close.svg";

const LoginView = ({ onClose, onLogin }) => {
  const [walletAddress, setWalletAddress] = useState("");
  const [password, setPassword] = useState("");

  const handleConfirm = (e) => {
    e.preventDefault();
    if (!walletAddress || !password) {
      alert("Please fill in all fields.");
      return;
    }
    onLogin({ walletAddress, password });
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black bg-opacity-70">
      <div className="bg-[#43444d] rounded-xl w-full max-w-md p-8 text-white shadow-2xl border border-gray-500">
        
        <div className="flex justify-end items-center mb-6">
          <button onClick={onClose} className="cursor-pointer p-1">
            <img src={closeIcon} className="w-6 h-6" alt="close" />
          </button>
        </div>

        <button
          className="w-full bg-[#028858] hover:bg-[#039260] py-3 rounded-lg font-bold transition-colors mb-6 cursor-pointer flex items-center justify-center gap-2 border border-emerald-500/30 shadow-md"
        >
          Connect Wallet
        </button>

        <div className="relative flex items-center my-4">
          <div className="flex-grow border-t border-gray-500"></div>
          <span className="flex-shrink mx-4 text-gray-400 text-sm">OR</span>
          <div className="flex-grow border-t border-gray-500"></div>
        </div>

        <form onSubmit={handleConfirm} className="space-y-5">
          <div className="form-group">
            <label className="block text-sm font-medium mb-1 text-gray-300">Wallet Address</label>
            <div className="relative flex items-center border-b-2 border-white">
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x000000000000"
                className="bg-transparent py-2 outline-none w-full text-lg placeholder-gray-500"
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label className="block text-sm font-medium mb-1 text-gray-300">Private Key</label>
            <div className="relative flex items-center border-b-2 border-white">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-transparent py-2 outline-none w-full text-lg placeholder-gray-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-transparent hover:bg-white/10 text-white border border-white py-3 rounded-lg font-bold transition-colors mt-6 cursor-pointer"
          >
            Log In
          </button>
        </form>

      </div>
    </div>
  );
};

export default LoginView;