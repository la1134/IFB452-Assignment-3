import { useState } from "react";
import LoginView from "./LoginView";
import searchIcon from "../assets/search.svg";
import loginIcon from "../assets/login.svg";
import logoutIcon from "../assets/logout.svg";
import { useWallet } from "./WalletContext";

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
            {account ? `Logout (${authType})` : "Login"}
          </span>
        </button>
      </div>

      <h1 className="pt-6 pb-12 text-6xl font-medium text-white">
        Ethstarter
      </h1>

      <p className="py-6 text-white-600">
        Help realise the projects you love
      </p>

      {/* Search */}
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

      {/* Login Modal */}
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