import { ethers } from "ethers";
import { useState, useEffect } from "react";
import { useWallet } from "./WalletContext";
import { MILESTONE_ABI } from "../contracts/MilestoneContract";
import closeIcon from "../assets/close.svg";

const MilestoneView = ({ projectData, milestoneAddress, onMilestoneContribute, isCreator, onClose }) => {
  const { account, getSignerOrProvider } = useWallet();
  const [rounds, setRounds]             = useState([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Round form
  const [newGoal, setNewGoal]         = useState("");
  const [newDuration, setNewDuration] = useState("");

  // Contribute form
  const [contributeRoundId, setContributeRoundId] = useState(null);
  const [contributeAmount, setContributeAmount]   = useState("");

  async function getMilestoneContract(withSigner = false) {
    const client = withSigner ? await getSignerOrProvider() : new ethers.BrowserProvider(window.ethereum);
    const signer = withSigner ? client : await client.getSigner().catch(() => client);
    return new ethers.Contract(milestoneAddress, MILESTONE_ABI, withSigner ? client : client);
  }

  // Fetches round details
  const fetchRounds = async () => {
    setIsLoading(true);
    try {
      const client = await getSignerOrProvider();
      const contract = new ethers.Contract(milestoneAddress, MILESTONE_ABI, client);
      const count = Number(await contract.roundCount());

      const roundData = await Promise.all(
        Array.from({ length: count }, (_, i) => i + 1).map(async (id) => {
          const info = await contract.getRoundInfo(id);
          const myContrib = account ? await contract.getContribution(id, account) : 0n;
          return {
            id,
            goal:             ethers.formatEther(info.goal),
            deadline:         Number(info.deadline),
            totalContributed: ethers.formatEther(info.totalContributed),
            withdrawn:        info.withdrawn,
            goalReached:      info.goalReached,
            timeRemaining:    Number(info.timeRemaining),
            myContribution:   myContrib,
          };
        })
      );
      setRounds(roundData);
    } catch (err) {
      console.error("Failed to fetch rounds:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchRounds(); }, [milestoneAddress, account]);

  // Call createRound from Milestone contract (through Factory)
  const handleCreateRound = async () => {
    if (!newGoal || !newDuration) { alert("Please fill in goal and duration."); return; }
    setIsSubmitting(true);
    try {
      const client = await getSignerOrProvider();
      const contract = new ethers.Contract(milestoneAddress, MILESTONE_ABI, client);
      const tx = await contract.createRound(ethers.parseEther(newGoal), Number(newDuration));
      await tx.wait();
      setNewGoal("");
      setNewDuration("");
      await fetchRounds();
    } catch (err) {
      alert("Failed to create round: " + (err.reason ?? err.message));
    } finally { setIsSubmitting(false); }
  };

  // Call parent onMilestoneContribute function from App.jsx
  const handleContribute = async (roundId) => {
    if (!contributeAmount || Number(contributeAmount) <= 0) return;
    
    setIsSubmitting(true);
    const success = await onMilestoneContribute(milestoneAddress, roundId, contributeAmount);
    
    if (success) {
      setContributeRoundId(null);
      setContributeAmount("");

      await fetchRounds(); 
    }
    setIsSubmitting(false);
  };

  // Call withdraw from Milestone contract
  const handleWithdraw = async (roundId) => {
    setIsSubmitting(true);
    try {
      const client = await getSignerOrProvider();
      const contract = new ethers.Contract(milestoneAddress, MILESTONE_ABI, client);
      const tx = await contract.withdraw(roundId);
      await tx.wait();
      alert("Round funds withdrawn!");
      await fetchRounds();
    } catch (err) {
      alert("Withdraw failed: " + (err.reason ?? err.message));
    } finally { setIsSubmitting(false); }
  };

  // Same for refund
  const handleRefund = async (roundId) => {
    setIsSubmitting(true);
    try {
      const client = await getSignerOrProvider();
      const contract = new ethers.Contract(milestoneAddress, MILESTONE_ABI, client);
      const tx = await contract.refund(roundId);
      await tx.wait();
      alert("Refund successful!");
      await fetchRounds();
    } catch (err) {
      alert("Refund failed: " + (err.reason ?? err.message));
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black bg-opacity-60">
      <div className="bg-[#43444d] rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">

        <div className="flex justify-between items-center p-4 border-b border-gray-600">
          <h2 className="text-white text-xl font-semibold">Milestone Rounds</h2>
          <button onClick={onClose} className="cursor-pointer p-2 rounded-full">
            <img src={closeIcon} className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-4">

          {/* Only creators can create new round */}
          {isCreator && (
            <div className="bg-black/20 border border-gray-600/40 rounded-lg p-4 space-y-3">
              <p className="text-white font-semibold">Create New Round</p>
              <div className="flex gap-x-4">
                <div className="flex-1">
                  <p className="text-gray-400 text-xs mb-1">Goal (ETH)</p>
                  <input
                    type="number" step="0.01" min="0"
                    value={newGoal}
                    onChange={e => setNewGoal(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-transparent border-b border-gray-500 text-white outline-none py-1 placeholder-gray-500"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-gray-400 text-xs mb-1">Duration (days)</p>
                  <input
                    type="number" min="1"
                    value={newDuration}
                    onChange={e => setNewDuration(e.target.value)}
                    placeholder="30"
                    className="w-full bg-transparent border-b border-gray-500 text-white outline-none py-1 placeholder-gray-500"
                  />
                </div>
              </div>
              <button
                onClick={handleCreateRound}
                disabled={isSubmitting}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 hover:cursor-pointer transition-colors disabled:opacity-50 text-sm"
              >
                {isSubmitting ? "Processing..." : "Create Round"}
              </button>
            </div>
          )}

          {/* Round list */}
          {isLoading ? (
            <p className="text-gray-400 text-center py-8">Loading rounds...</p>
          ) : rounds.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No milestone rounds yet.</p>
          ) : (
            rounds.map((round) => {
              const deadlinePassed = round.timeRemaining === 0;
              const daysLeft = Math.ceil(round.timeRemaining / (24 * 60 * 60));
              const barWidth = Math.min((Number(round.totalContributed) / Number(round.goal)) * 100, 100);
              const canRefund = !isCreator && deadlinePassed && !round.goalReached && round.myContribution > 0n;
              const canContribute = !isCreator && !deadlinePassed && !round.withdrawn;
              const canWithdraw = isCreator && round.goalReached && !round.withdrawn;

              return (
                <div key={round.id} className="bg-black/20 border border-gray-600/40 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-white font-semibold">Round {round.id}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      round.withdrawn ? "bg-gray-600 text-gray-300" :
                      round.goalReached ? "bg-green-800 text-green-300" :
                      deadlinePassed ? "bg-red-900 text-red-300" :
                      "bg-blue-900 text-blue-300"
                    }`}>
                      {round.withdrawn ? "Completed" : round.goalReached ? "Goal Met" : deadlinePassed ? "Expired" : `${daysLeft}d left`}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="flex items-center gap-x-3">
                    <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${barWidth}%` }} />
                    </div>
                    <p className="text-sm text-gray-300 whitespace-nowrap">
                      {round.totalContributed} / {round.goal} ETH
                    </p>
                  </div>

                  {round.myContribution > 0n && (
                    <p className="text-green-400 text-xs pb-6">Your contribution: {ethers.formatEther(round.myContribution)} ETH</p>
                  )}

                  {/* Contribute form */}
                  {canContribute && (
                    contributeRoundId === round.id ? (
                      <div className="flex gap-x-2 items-center">
                        <input
                          type="number" step="0.01" min="0"
                          value={contributeAmount}
                          onChange={e => setContributeAmount(e.target.value)}
                          placeholder="Amount in ETH"
                          className="flex-1 bg-transparent border-b border-gray-500 text-white outline-none py-1 placeholder-gray-500 text-sm"
                        />
                        <button onClick={() => handleContribute(round.id)} disabled={isSubmitting}
                          className="bg-[#028858] text-white px-3 py-1 rounded-lg text-sm hover:bg-[#039260] hover:cursor-pointer disabled:opacity-50">
                          {isSubmitting ? "..." : "Confirm"}
                        </button>
                        <button onClick={() => { setContributeRoundId(null); setContributeAmount(""); }}
                          className="text-gray-400 text-sm hover:text-white px-2 hover:cursor-pointer">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setContributeRoundId(round.id)} disabled={isSubmitting}
                        className="bg-[#028858] text-white px-4 py-1.5 rounded-lg text-sm hover:bg-[#039260] hover:cursor-pointer transition-colors disabled:opacity-50">
                        Fund this Round
                      </button>
                    )
                  )}

                  {canWithdraw && (
                    <button onClick={() => handleWithdraw(round.id)} disabled={isSubmitting}
                      className="bg-[#028858] text-white px-4 py-1.5 rounded-lg text-sm hover:bg-[#039260] transition-colors disabled:opacity-50">
                      {isSubmitting ? "Processing..." : "Withdraw Round Funds"}
                    </button>
                  )}

                  {canRefund && (
                    <button onClick={() => handleRefund(round.id)} disabled={isSubmitting}
                      className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-red-700 transition-colors hover:cursor-pointer disabled:opacity-50">
                      {isSubmitting ? "Processing..." : "Claim Refund"}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default MilestoneView;