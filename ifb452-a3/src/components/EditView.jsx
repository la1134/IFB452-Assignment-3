import { useState } from "react";
import { ethers } from "ethers";
import closeIcon from "../assets/close.svg";
import { useWallet } from "./WalletContext";
import { ESCROW_ABI, ESCROW_BYTECODE } from "../contracts/EscrowContract";

const EditView = ({ projectData, onClose, onSaveProject }) => {
  const { account } = useWallet();

  const currentDate = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    id:              projectData?.id              ?? null,
    title:           projectData?.title           ?? "",
    owner:           projectData?.owner           ?? "",
    goal:            projectData?.goal            ?? "",
    deadline:        projectData?.deadline
      ? new Date(projectData.deadline).toISOString().split("T")[0]
      : "",
    description:     projectData?.description     ?? "",
    balance:         projectData?.balance         ?? 0,
    creatorAddress:  projectData?.creatorAddress  ?? account ?? "",
    contractAddress: projectData?.contractAddress ?? "",
  });

  const [isDeploying, setIsDeploying] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePublishClick = async () => {
    if (!formData.title || !formData.goal || !formData.deadline) {
      alert("Please fill in all required fields.");
      return;
    }

    const goalNum = Number(formData.goal);
    if (goalNum <= 0) {
      alert("Funding goal must be greater than 0 ETH.");
      return;
    }

    const selectedDate = new Date(formData.deadline);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    if (selectedDate < todayDate) {
      alert("The deadline cannot be in the past.");
      return;
    }

    const finalData = { ...formData, goal: Number(formData.goal) };

    // ── Editing — just save, no re-deploy ─────────────────────────────
    if (formData.id) {
      onSaveProject(finalData);
      return;
    }

    // ── New project — deploy EscrowContract on-chain ──────────────────
    if (!window.ethereum) {
      alert("MetaMask is required to deploy a project on-chain.");
      return;
    }

    if (!ESCROW_BYTECODE || ESCROW_BYTECODE === "0x...") {
      alert(
        "No contract bytecode found.\n\n" +
        "Paste your compiled ESCROW_BYTECODE into contracts/EscrowContract.js to enable on-chain deployment."
      );
      return;
    }

    try {
      setIsDeploying(true);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer   = await provider.getSigner();

      const deadlineDate = new Date(formData.deadline);
      const today        = new Date();
      const durationDays = Math.max(
        1,
        Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24))
      );

      const goalInWei = ethers.parseEther(String(formData.goal));

      const factory  = new ethers.ContractFactory(ESCROW_ABI[0], ESCROW_BYTECODE, signer);
      const contract = await factory.deploy(goalInWei, durationDays);
      await contract.waitForDeployment();

      const contractAddress = await contract.getAddress();

      onSaveProject({ ...finalData, contractAddress });
    } catch (err) {
      console.error("Deployment error:", err);
      alert("Deployment failed: " + (err.reason ?? err.message));
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-[#43444d] rounded-xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col">

        {/* Top bar */}
        <div className="flex justify-end items-center p-4 border-b border-gray-600">
          <button
            onClick={onClose}
            disabled={isDeploying}
            className="cursor-pointer p-2 rounded-full"
          >
            <img src={closeIcon} className="w-6 h-6" />
          </button>
        </div>

        {/* Form body */}
        <div className="overflow-y-auto text-white text-left px-16 py-4 space-y-6">

          <div className="form-group">
            <p className="pt-4 pb-1 text-lg font-semibold">Project Title</p>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="border-b-2 placeholder-gray-300 bg-transparent outline-none w-1/3"
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
              className="border-b-2 placeholder-gray-300 bg-transparent outline-none w-1/3"
              placeholder="Project Owner"
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
                  className="bg-transparent py-1 outline-none placeholder-gray-300 flex-1"
                  placeholder="0.00"
                  required
                />
                <span className="ml-2 pb-1">ETH</span>
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
                readOnly={!!formData.id}
                className="placeholder-gray-300 bg-transparent outline-none"
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
              className="border-2 placeholder-gray-300 w-full bg-transparent outline-none p-2"
              placeholder="Project Description"
              required
            />
          </div>

          {/* Contract address — shown when editing an already-deployed project */}
          {formData.id && formData.contractAddress && (
            <div className="form-group">
              <p className="pt-2 pb-1 text-sm font-semibold text-gray-400">Contract Address</p>
              <p className="text-xs font-mono text-gray-400 break-all">{formData.contractAddress}</p>
            </div>
          )}

          {/* Deploy note for new projects */}
          {!formData.id && (
            <p className="text-xs text-gray-400">
              Publishing will deploy a new EscrowContract to the blockchain via MetaMask.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-start py-6 px-16 border-t border-gray-600">
          <button
            className="bg-[#028858] text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-[#039260] disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={handlePublishClick}
            disabled={isDeploying}
          >
            {isDeploying
              ? "Deploying contract…"
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