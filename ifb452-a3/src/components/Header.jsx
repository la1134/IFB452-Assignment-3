import { useState } from "react";
import LoginView from "./LoginView";
import "../App.css";
import searchIcon from "../assets/search.svg";
import loginIcon from "../assets/login.svg"
import logoutIcon from "../assets/logout.svg"

function Header({ onSearch }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  const handleChange = (e) => {
    setSearchQuery(e.target.value);
    onSearch(e.target.value);
  }

  const handleAuthAction = () => {
    if (loggedIn) {
      setLoggedIn(false);
    } else {
      setIsLoginOpen(true);
    }
  };

  const onLogin = (walletAddress, password) => {
    setIsLoginOpen(false);
    setLoggedIn(true);
  };

  return (
    <section className="p-4">
      <div className="absolute top-8 right-10">
        <button 
          className={`flex items-center gap-2 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors shadow-md ${
            loggedIn ? "bg-red-600 hover:bg-red-500" : "bg-blue-600 hover:bg-blue-500"
          }`}
          onClick={handleAuthAction}
        >
          <img 
            src={loggedIn ? logoutIcon : loginIcon} 
            alt={loggedIn ? "Logout" : "Login"} 
            className="w-5 h-5"
          />
          <span>{loggedIn ? "Logout" : "Login"}</span>
        </button>
      </div>
      <h1 className="pt-6 pb-12 text-6xl font-medium text-white">Ethstarter</h1>
      <p className="py-6 text-white-600">Help realise the projects you love</p>
      
      <div className="w-full max-w-md mx-auto py-2">
        <div className="relative flex items-center">
          
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <img 
              src={searchIcon} 
              alt="Search" 
              className="w-5 h-5 opacity-50"
            />
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

      {isLoginOpen && <LoginView onClose={() => setIsLoginOpen(false)} onLogin={onLogin} />}
    </section>
  );
}

export default Header;