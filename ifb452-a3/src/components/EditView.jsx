import { useState } from "react";
import closeIcon from "../assets/close.svg"
import timeIcon from "../assets/time.svg"

const EditView = ({ projectData, onPublish, onClose } ) => {

    const currentDate = new Date().toISOString().split('T')[0];

    const [formData, setFormData] = useState({
        title: projectData?.title || "",
        owner: projectData?.owner || "",
        goal: projectData?.goal || "",
        deadline: projectData?.deadline || "",
        description: projectData?.description || ""
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePublishClick = () => {
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

        const finalData = {
            ...formData,
            goal: Number(formData.goal)
        };

        onPublish(finalData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-[#43444d] rounded-xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col">
                <div className="flex justify-end items-center p-4 border-b">
                    <button 
                    onClick={onClose}
                    className="cursor-pointer p-2 rounded-full"
                    >
                    <img src={closeIcon} className="w-6 h-6"/>
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
                            className="border-b-2 placeholder-gray-300" 
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
                            className="border-b-2 placeholder-gray-300" 
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
                        
                        <div className="form-group">
                            <p className="pt-4 pb-1 text-lg font-semibold">Funding Deadline</p>
                            <input 
                                type="date" 
                                name="deadline"
                                min={currentDate}
                                value={formData.deadline}
                                onChange={handleChange}
                                className="border-b-2 placeholder-gray-300" 
                                placeholder="Funding Goal" 
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <p className="pt-4 pb-1 text-lg font-semibold">Project Description</p>
                        <textarea 
                            type="text" 
                            name="description"
                            cols="30"
                            rows="10"
                            value={formData.description}
                            onChange={handleChange}
                            className="border-2 placeholder-gray-300 w-full" 
                            placeholder="Project Description" 
                            required
                        />
                    </div>

                </div>
                <div className="flex justify-start py-6 px-16">
                    <button 
                        className="bg-[#028858] text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-[#039260]"
                        onClick={handlePublishClick}
                    >
                        Publish Project
                    </button>
                </div>
            </div>
        </div>
    )
};

export default EditView;