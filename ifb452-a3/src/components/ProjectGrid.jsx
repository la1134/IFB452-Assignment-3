
import '../App.css'

const ProjectGrid = ({connectionsData}) => {
  const currentDate = new Date();

  return (
    <div>
      <div className="grid sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 w-[75%] mx-auto">
        {connectionsData.map((project, index) => {
          const msLeft = project.deadline - currentDate;
          const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
          const percentageFunded = Math.round((project.balance / project.goal) * 100);

          return (
            <div key={`connection-${index}`} className="flex flex-col items-center m-2">
              <div className="bg-[#43444d] sm:w-100 md:w-67.5 lg:w-93.75 xl:w-78.75 2xl:w-100 h-full rounded-lg shadow-xl">
                <img 
                  src={project.banner}
                  alt="Profile Banner"
                  className="w-full h-50 object-cover object-[0%_20%] rounded-t-lg"
                ></img>
                <div>
                  <div className="flex flex-col items-center py-4">
                    <h2 className="text-center text-lg font-medium">{project.title}</h2>
                    <p className="text-center text-xs font-semibold px-6 pb-4">{project.owner}</p>
                    <div className="flex">
                      <p className="text-center text-xs font-semibold px-6 text-gray-300">{daysLeft.toLocaleString()} days left</p>
                      <p className="text-center text-xs font-semibold px-6 text-gray-300">{percentageFunded.toLocaleString()}% funded</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            );
          })}
        </div>
    </div>
  )
}

export default ProjectGrid
