import { createContext, useContext, useState, useEffect } from "react";
import { connectWallet, onAccountChange, onNetworkChange } from "../web3";

const WalletContext = createContext();

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [authType, setAuthType] = useState(null); // "metamask" | "manual"
  const [isLoading, setIsLoading] = useState(false);

  // ── Restore session on page load ──────────────────────────────────────
  useEffect(() => {
    const savedAccount  = localStorage.getItem("wallet_account");
    const savedAuthType = localStorage.getItem("wallet_authType");

    if (savedAuthType === "metamask" && window.ethereum) {
      // Re-verify MetaMask still has the account connected
      window.ethereum
        .request({ method: "eth_accounts" })
        .then((accounts) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setAuthType("metamask");
          } else {
            // MetaMask was disconnected externally — clear storage
            clearSession();
          }
        });
    } else if (savedAuthType === "manual" && savedAccount) {
      setAccount(savedAccount);
      setAuthType("manual");
    }

    // Listen for MetaMask account switches
    onAccountChange((accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setAuthType("metamask");
        localStorage.setItem("wallet_account",  accounts[0]);
        localStorage.setItem("wallet_authType", "metamask");
      } else {
        clearSession();
      }
    });

    onNetworkChange(() => window.location.reload());
  }, []);

  function clearSession() {
    setAccount(null);
    setAuthType(null);
    localStorage.removeItem("wallet_account");
    localStorage.removeItem("wallet_authType");
  }

  // ── MetaMask ──────────────────────────────────────────────────────────
  async function connect() {
    setIsLoading(true);
    try {
      const signer  = await connectWallet();
      const address = await signer.getAddress();
      setAccount(address);
      setAuthType("metamask");
      localStorage.setItem("wallet_account",  address);
      localStorage.setItem("wallet_authType", "metamask");
      return signer;
    } catch (err) {
      console.error("Wallet error:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  // ── Manual ────────────────────────────────────────────────────────────
  function loginManual(walletAddress, privateKey) {
    if (!walletAddress || !privateKey) {
      alert("Please fill in both fields.");
      return null;
    }
    setAccount(walletAddress);
    setAuthType("manual");
    localStorage.setItem("wallet_account",  walletAddress);
    localStorage.setItem("wallet_authType", "manual");
    return walletAddress;
  }

  function logout() {
    clearSession();
  }

  return (
    <WalletContext.Provider
      value={{ account, authType, isLoading, connect, loginManual, logout }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}