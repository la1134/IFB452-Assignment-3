import "../App.css";
// Import the path to the file, not a component
import searchIconPath from "../assets/search.svg";

function Header() {
  return (
    <section className="p-4">
      <h1 className="py-2 text-2xl font-bold">Ethstarter</h1>
      <p className="py-4 text-white-600">Help realise the projects you love</p>
      
      <div className="w-full max-w-md mx-auto py-2">
        <div className="relative flex items-center">
          
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <img 
              src={searchIconPath} 
              alt="Search" 
              className="w-5 h-5 opacity-50"
            />
          </div>

          <input 
            type="text" 
            className="block w-full border border-gray-300 rounded-lg py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            placeholder="Search for a project"
          />
          
        </div>
      </div>
    </section>
  );
}

export default Header;