'use client';

import { useAccount, useConnect, useDisconnect, useChainId } from 'wagmi';
import { useEffect, useMemo, useState } from 'react';

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const preferredConnector = useMemo(() => {
    const injectedConnector = connectors.find((connector) => connector.id === 'injected');
    return injectedConnector ?? connectors[0];
  }, [connectors]);

  const handleConnect = () => {
    if (!preferredConnector) {
      alert('No wallet detected. Please install MetaMask or another injected wallet.');
      return;
    }

    connect({ connector: preferredConnector });
  };

  if (isMounted && isConnected && address) {
    const isCorrectNetwork = chainId === 80002;

    return (
      <button
        onClick={() => disconnect()}
        className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg transition"
        title={isCorrectNetwork ? 'Disconnect wallet' : 'Connected on a different network'}
      >
        Disconnect
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleConnect}
        disabled={!isMounted || !preferredConnector || isPending}
        className="bg-white hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed text-celo-dark font-semibold px-6 py-2 rounded-lg transition"
      >
        {isMounted && isPending ? 'Connecting...' : 'Connect Wallet'}
      </button>
      {error ? <p className="text-xs text-red-300">{error.message}</p> : null}
    </div>
  );
}
// ConnectButton component
// ConnectButton component
