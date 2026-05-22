import { useState } from "react";
import { useWallet } from "./WalletContext";
import LoginView from "./LoginView";
import searchIcon from "../assets/search.svg";
import loginIcon from "../assets/login.svg";
import logoutIcon from "../assets/logout.svg";

function Header({ onSearch }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { account, authType, logout } = useWallet();

  const handleChange = (e) => {
    setSearchQuery(e.target.value);
    onSearch(e.target.value);
  };

  const handleAuthAction = () => {
    if (account) {
      logout();
    } else {
      setIsLoginOpen(true);
    }
  };

  return (
    <section className="p-4">

      {/* Account name */}
      {account && (
        <div className="absolute top-8 right-44 bg-gray-700 text-gray-200 text-sm px-3 py-2 rounded-lg font-mono">
          {account.slice(0, 6)}...{account.slice(-4)}
        </div>
      )}

      {/* Login Button */}
      <div className="absolute top-8 right-10">
        <button
          className={`flex items-center gap-2 text-white px-4 py-2 rounded-lg cursor-pointer ${
            account ? "bg-red-600" : "bg-blue-600"
          }`}
          onClick={handleAuthAction}
        >
          <img
            src={account ? logoutIcon : loginIcon}
            className="w-5 h-5"
          />
          <span>
            {account ? "Logout" : "Login"}
          </span>
        </button>
      </div>

      <h1 className="pt-6 pb-12 text-6xl font-medium text-white">
        Ethstarter
      </h1>

      <p className="py-6 text-white">
        Help realise the projects you love
      </p>
      <div className="w-full max-w-md mx-auto py-2">
        <div className="relative flex items-center">

          <div className="absolute left-3">
            <img src={searchIcon} className="w-5 h-5 opacity-50" />
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={handleChange}
            className="w-full border rounded-lg py-2 pl-10"
            placeholder="Search for a project"
          />

        </div>
      </div>

      {/* Login popup */}
      {isLoginOpen && (
        <LoginView
          onClose={() => setIsLoginOpen(false)}
          onSuccess={() => setIsLoginOpen(false)}
        />
      )}
    </section>
  );
}

export default Header;