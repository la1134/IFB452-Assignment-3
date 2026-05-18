import { useState } from "react";
import "../App.css";
import searchIcon from "../assets/search.svg";
import { useWallet } from "./WalletContext";

function Header({ onSearch }) {
  const [searchQuery, setSearchQuery] = useState("");
  const { account, isConnected, isLoading, connect } = useWallet();

  const handleChange = (e) => {
    setSearchQuery(e.target.value);
    onSearch(e.target.value);
  };

  const shortAddress = account
    ? `${account.slice(0, 6)}...${account.slice(-4)}`
    : null;

  return (
    <section className="p-4">
      <div className="flex justify-between items-start">
        <h1 className="pt-6 pb-12 text-6xl font-medium text-white">Ethstarter</h1>
        <div className="pt-6">
          {isConnected ? (
            <div className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-mono">
              ✅ {shortAddress}
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={isLoading}
              className="bg-[#028858] text-white px-4 py-2 rounded-lg hover:bg-[#039260] transition-colors cursor-pointer"
            >
              {isLoading ? "Connecting..." : "Connect Wallet"}
            </button>
          )}
        </div>
      </div>

      <p className="py-6 text-white-600">Help realise the projects you love</p>

      <div className="w-full max-w-md mx-auto py-2">
        <div className="relative flex items-center">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <img src={searchIcon} alt="Search" className="w-5 h-5 opacity-50" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleChange}
            className="block w-full border border-gray-300 rounded-lg py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search for a project"
          />
        </div>
      </div>
    </section>
  );
}

export default Header;