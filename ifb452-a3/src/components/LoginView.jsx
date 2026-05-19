import { useState } from "react";
import closeIcon from "../assets/close.svg";
import { useWallet } from "./WalletContext";

const LoginView = ({ onClose, onSuccess }) => {
  const { connect, loginManual } = useWallet();

  const [walletAddress, setWalletAddress] = useState("");
  const [privateKey, setPrivateKey] = useState("");

  // MetaMask login
  const handleMetaMask = async () => {
    const signer = await connect();
    if (signer) onSuccess();
  };

  // Manual login
  const handleManual = (e) => {
    e.preventDefault();

    const wallet = loginManual(walletAddress, privateKey);
    if (wallet) onSuccess();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-[#43444d] rounded-xl w-full max-w-md p-8 text-white shadow-2xl">

        {/* Top */}
        <div className="flex justify-between mb-6">
          <h2 className="text-2xl font-medium">Login</h2>
          <button onClick={onClose} className="hover:cursor-pointer">
            <img src={closeIcon} className="w-6 h-6" />
          </button>
        </div>

        {/* MetaMask Login */}
        <button
          onClick={handleMetaMask}
          className="w-full bg-[#028858] hover:bg-[#039260] py-3 rounded-lg my-2 font-bold hover:cursor-pointer"
        >
          Connect MetaMask Wallet
        </button>


        <div className="relative flex items-center my-4">
          <div className="grow border-t border-gray-500"></div>
          <span className="shrink mx-4 text-gray-400 text-sm">OR</span>
          <div className="grow border-t border-gray-500"></div>
        </div>

        <form onSubmit={handleManual} className="space-y-4">
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
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="••••••••"
                className="bg-transparent py-2 outline-none w-full text-lg placeholder-gray-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gray-600 py-3 rounded-lg font-bold hover:cursor-pointer"
          >
            Login Manually
          </button>
        </form>

      </div>
    </div>
  );
};

export default LoginView;