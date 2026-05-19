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

        {/* Close */}
        <div className="flex justify-end mb-6">
          <button onClick={onClose}>
            <img src={closeIcon} className="w-6 h-6" />
          </button>
        </div>

        {/* MetaMask Login */}
        <button
          onClick={handleMetaMask}
          className="w-full bg-[#028858] hover:bg-[#039260] py-3 rounded-lg font-bold mb-6"
        >
          Connect MetaMask Wallet
        </button>

        <div className="text-center text-gray-400 mb-4">
          OR Manual Login
        </div>

        {/* Manual Login */}
        <form onSubmit={handleManual} className="space-y-4">

          <input
            type="text"
            placeholder="Wallet Address"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            className="w-full p-2 bg-transparent border rounded"
          />

          <input
            type="password"
            placeholder="Private Key"
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            className="w-full p-2 bg-transparent border rounded"
          />

          <button
            type="submit"
            className="w-full bg-gray-600 py-3 rounded-lg font-bold"
          >
            Login Manually
          </button>

        </form>

      </div>
    </div>
  );
};

export default LoginView;