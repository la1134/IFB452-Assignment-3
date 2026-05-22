import { useState } from "react";
import { useWallet } from "./WalletContext";
import closeIcon from "../assets/close.svg";

const EditView = ({ projectData, onClose, onSaveProject }) => {
  const { account } = useWallet();
  const currentDate = new Date().toISOString().split("T")[0];

  // Default Form Data
  const [formData, setFormData] = useState({
    id:              projectData?.id              ?? null,
    title:           projectData?.title           ?? "",
    owner:           projectData?.owner           ?? "",
    goal:            projectData?.goal            ?? "",
    deadline:        projectData?.deadline
      ? new Date(projectData.deadline * 1000).toISOString().split("T")[0] 
      : "",
    description:     projectData?.description     ?? "",
    balance:         projectData?.balance         ?? 0,
    creatorAddress:  projectData?.creatorAddress  ?? account ?? "",
    contractAddress: projectData?.contractAddress ?? "",
  });

  const [isDeploying, setIsDeploying] = useState(false);
  const hasContract = !!formData.contractAddress;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Publishing
  const handlePublishClick = async () => {
    if (!formData.title || !formData.owner || !formData.goal || !formData.deadline || !formData.description) {
      alert("Please fill in all required fields.");
      return;
    }

    const goalNum = Number(formData.goal);
    if (goalNum <= 0) {
      alert("Funding goal must be greater than 0 ETH.");
      return;
    }
    
    const parts = formData.deadline.split("-");
    const targetDeadlineDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    
    // Set deadline to the precise end of calendar day
    targetDeadlineDate.setHours(23, 59, 59, 999);

    // Compute absolute Unix timestamp representation
    const deadlineTimestamp = Math.floor(targetDeadlineDate.getTime() / 1000);
    const currentUnixTime = Math.floor(Date.now() / 1000);

    if (deadlineTimestamp <= currentUnixTime) {
      alert("The deadline must be a future time.");
      return;
    }

    // Validation checks
    const cleanTitle = String(formData.title).trim();
    const cleanOwner = String(formData.owner).trim();
    const cleanDesc  = String(formData.description).trim();

    if (cleanTitle.length === 0 || cleanTitle.length > 50) return alert("Title must be between 1 and 50 characters.");
    if (cleanOwner.length === 0 || cleanOwner.length > 40) return alert("Owner name must be between 1 and 40 characters.");
    if (cleanDesc.length === 0 || cleanDesc.length > 280) return alert("Description must be between 1 and 280 characters.");

    const finalData = { 
      ...formData, 
      title: cleanTitle,
      owner: cleanOwner,
      description: cleanDesc,
      goal: goalNum, 
      deadline: deadlineTimestamp 
    };

    try {
      setIsDeploying(true);
      await onSaveProject(finalData);
      onClose();
    } catch (err) {
      console.error("Form handling exception:", err);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-[#43444d] rounded-xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col">

        <div className="flex justify-end items-center p-4 border-b border-gray-600">
          <button
            onClick={onClose}
            disabled={isDeploying}
            className="cursor-pointer p-2 rounded-full disabled:opacity-30"
          >
            <img src={closeIcon} className="w-6 h-6" alt="Close" />
          </button>
        </div>

        <div className="overflow-y-auto text-white text-left px-16 py-4 space-y-6">
          <div className="form-group">
            <p className="pt-4 pb-1 text-lg font-semibold">Project Title</p>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              disabled={isDeploying || hasContract}
              className="border-b-2 placeholder-gray-300 bg-transparent outline-none w-1/3 disabled:opacity-50"
              placeholder="Project Title"
              required
            />
          </div>

          <div className="form-group">
            <p className="pt-4 pb-1 text-lg font-semibold">Project Owner</p>
            <input
              type="text"
              name="owner"
              value={formData.owner}
              onChange={handleChange}
              disabled={isDeploying || hasContract}
              className="border-b-2 placeholder-gray-300 bg-transparent outline-none w-1/3 disabled:opacity-50"
              placeholder="Project Owner Name"
              required
            />
          </div>

          <div className="flex gap-x-30">
            <div className="form-group">
              <p className="pt-4 pb-1 text-lg font-semibold">Funding Goal</p>
              <div className="relative flex items-center border-b-2 border-white transition-colors">
                <input
                  type="number"
                  step="0.01"
                  name="goal"
                  min="0.000000000000000001"
                  value={formData.goal}
                  onChange={handleChange}
                  readOnly={hasContract}
                  disabled={isDeploying}
                  className={`bg-transparent py-1 outline-none placeholder-gray-300 flex-1 disabled:opacity-50 ${hasContract ? "text-gray-400 cursor-not-allowed" : ""}`}
                  placeholder="0.00"
                  required
                />
                <span className={`ml-2 pb-1 ${hasContract ? "text-gray-400" : ""}`}>ETH</span>
              </div>
            </div>

            <div className="form-group border-b-2">
              <p className="pt-4 pb-1 text-lg font-semibold">Funding Deadline</p>
              <input
                type="date"
                name="deadline"
                min={currentDate}
                value={formData.deadline}
                onChange={handleChange}
                readOnly={hasContract}
                disabled={isDeploying}
                className={`placeholder-gray-300 bg-transparent outline-none disabled:opacity-50 ${hasContract ? "text-gray-400 cursor-not-allowed" : ""}`}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <p className="pt-4 pb-1 text-lg font-semibold">Project Description</p>
            <textarea
              name="description"
              cols="30"
              rows="10"
              value={formData.description}
              onChange={handleChange}
              disabled={isDeploying || hasContract}
              className="border-2 placeholder-gray-300 w-full bg-transparent outline-none p-2 rounded-md transition-colors disabled:opacity-50"
              placeholder="Project Description"
              required
            />
          </div>

          {hasContract && (
            <div className="form-group bg-black/20 p-4 rounded-lg border border-gray-600/40">
              <p className="pb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">Deployed Contract Address</p>
              <p className="text-sm font-mono text-green-400 break-all select-all">{formData.contractAddress}</p>
            </div>
          )}
        </div>

        <div className="flex justify-start py-6 px-16 border-t border-gray-600">
          <button
            className="bg-[#028858] text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-[#039260] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
            onClick={handlePublishClick}
            disabled={isDeploying}
          >
            {isDeploying
              ? "Processing Transaction…"
              : formData.id
                ? "Save Changes"
                : "Publish Project"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default EditView;