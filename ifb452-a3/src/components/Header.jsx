import { useState } from "react";
import "../App.css";
import searchIcon from "../assets/search.svg";

function Header({ onSearch }) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleChange = (e) => {
    setSearchQuery(e.target.value);
    onSearch(e.target.value);
  }


  return (
    <section className="p-4">
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
    </section>
  );
}

export default Header;