import { createContext, useContext, useState, useEffect } from "react";
import { connectWallet, onAccountChange, onNetworkChange } from "../web3";

const WalletContext = createContext();

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Auto-connect if previously connected
    async function checkConnection() {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
        }
      }
    }
    checkConnection();

    onAccountChange((accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
      } else {
        setAccount(null);
        setIsConnected(false);
      }
    });

    onNetworkChange(() => window.location.reload());
  }, []);

  async function connect() {
    setIsLoading(true);
    try {
      const signer = await connectWallet();
      if (signer) {
        const address = await signer.getAddress();
        setAccount(address);
        setIsConnected(true);
      }
    } catch (err) {
      console.error("Wallet connection failed:", err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <WalletContext.Provider value={{ account, isConnected, isLoading, connect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}