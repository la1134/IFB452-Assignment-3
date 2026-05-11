import { ethers } from "ethers";

// Connect MetaMask and return signer
export async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask not found. Please install it from metamask.io");
    return null;
  }
  await window.ethereum.request({ method: "eth_requestAccounts" });
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return signer;
}

// Get provider (read-only, no wallet needed)
export async function getProvider() {
  if (!window.ethereum) throw new Error("MetaMask not found");
  return new ethers.BrowserProvider(window.ethereum);
}

// Get connected wallet address
export async function getWalletAddress() {
  const signer = await connectWallet();
  if (!signer) return null;
  return await signer.getAddress();
}

// Listen for account changes
export function onAccountChange(callback) {
  if (window.ethereum) {
    window.ethereum.on("accountsChanged", callback);
  }
}

// Listen for network changes
export function onNetworkChange(callback) {
  if (window.ethereum) {
    window.ethereum.on("chainChanged", callback);
  }
}