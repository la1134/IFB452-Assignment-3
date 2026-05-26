import { ethers } from "ethers";
import { createContext, useContext, useState, useEffect } from "react";
import { connectWallet, onAccountChange, onNetworkChange } from "../web3";

const WalletContext = createContext();

const HARDHAT_RPC_URL = "http://127.0.0.1:8545";

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [authType, setAuthType] = useState(null); // valueas are "metamask" or "manual"
  const [privateKey, setPrivateKey] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Restore session on page load
  useEffect(() => {
    const savedAccount  = localStorage.getItem("wallet_account");
    const savedAuthType = localStorage.getItem("wallet_authType");

    if (savedAuthType === "metamask" && window.ethereum) {
      window.ethereum
        .request({ method: "eth_accounts" })
        .then((accounts) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setAuthType("metamask");
          } else {
            clearSession();
          }
        })
        .catch(() => clearSession());
    } else if (savedAuthType === "manual" && savedAccount) {
      // Look for key matching the address in session storage for security
      const savedKey = sessionStorage.getItem("wallet_pk");
      if (savedKey) {
        setAccount(savedAccount);
        setAuthType("manual");
        setPrivateKey(savedKey);
      } else {
        clearSession();
      }
    }

    // Listen for MetaMask account switches
    let removeAccountListener;
    if (window.ethereum && onAccountChange) {
      removeAccountListener = onAccountChange((accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setAuthType("metamask");
          localStorage.setItem("wallet_account",  accounts[0]);
          localStorage.setItem("wallet_authType", "metamask");
          sessionStorage.removeItem("wallet_pk"); // Flush explicit key if switching
        } else {
          clearSession();
        }
      });
    }

    if (window.ethereum && onNetworkChange) {
      onNetworkChange(() => window.location.reload());
    }
  }, []);

  function clearSession() {
    setAccount(null);
    setAuthType(null);
    setPrivateKey(null);
    localStorage.removeItem("wallet_account");
    localStorage.removeItem("wallet_authType");
    sessionStorage.removeItem("wallet_pk");
  }

  // MetaMask
  async function connect() {
    setIsLoading(true);
    try {
      const signer  = await connectWallet();
      const address = await signer.getAddress();
      setAccount(address);
      setAuthType("metamask");
      localStorage.setItem("wallet_account",  address);
      localStorage.setItem("wallet_authType", "metamask");
      sessionStorage.removeItem("wallet_pk");
      return signer;
    } catch (err) {
      console.error("Wallet error:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  // Manual Hardhat Accounts
  async function loginManual(walletAddress, inputPrivateKey) {
    if (!walletAddress || !inputPrivateKey) {
      alert("Please fill in both fields.");
      return null;
    }

    const formattedKey = inputPrivateKey.startsWith("0x") ? inputPrivateKey : `0x${inputPrivateKey}`;

    try {
      const derived = new ethers.Wallet(formattedKey);
      if (derived.address.toLowerCase() !== walletAddress.toLowerCase()) {
        alert("Private key does not match the wallet address.");
        return null;
      }
    } catch {
      alert("Invalid login.");
      return null;
    }

    // Verify connection & active balance allocations
    try {
      const provider = new ethers.JsonRpcProvider(HARDHAT_RPC_URL);
      const balance  = await provider.getBalance(walletAddress);
      if (balance === 0n) {
        alert("This wallet has no funds on the local network. Are you using an active Hardhat genesis account?");
        return null;
      }
    } catch {
      alert("Could not connect to local Hardhat node. Make sure your local node console terminal is running.");
      return null;
    }

    setAccount(walletAddress);
    setAuthType("manual");
    setPrivateKey(formattedKey);
    localStorage.setItem("wallet_account",  walletAddress);
    localStorage.setItem("wallet_authType", "manual");
    sessionStorage.setItem("wallet_pk", formattedKey);
    return walletAddress;
  }

  function logout() {
    clearSession();
  }

  async function getSignerOrProvider() {
    if (authType === "metamask" && window.ethereum) {
    // Force switch to Hardhat network
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x7a69" }], // 31337 in hex
      });
    } catch (switchError) {
      // Network not added yet, add it
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: "0x7a69",
            chainName: "Hardhat",
            rpcUrls: ["http://127.0.0.1:8545"],
            nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
          }],
        });
      }
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    return await provider.getSigner();
  }
    
    if (authType === "manual" && privateKey) {
      const provider = new ethers.JsonRpcProvider(HARDHAT_RPC_URL);
      return new ethers.Wallet(privateKey, provider);
    }
    
    if (window.ethereum) {
      return new ethers.BrowserProvider(window.ethereum);
    }
    return new ethers.JsonRpcProvider(HARDHAT_RPC_URL);
  }

  return (
    <WalletContext.Provider
      value={{ account, authType, isLoading, connect, loginManual, logout, getSignerOrProvider }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}