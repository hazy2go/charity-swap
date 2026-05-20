"use client";

import {
  useXAccount,
  useXConnect,
  useXConnectors,
  useXDisconnect,
  sortConnectors,
} from "@sodax/wallet-sdk-react";

const PREFERRED = ["hana", "metamask", "rabby"] as const;

export function ConnectButton() {
  const raw = useXConnectors({ xChainType: "EVM" });
  const connectors = sortConnectors(raw, { preferred: PREFERRED });
  const { mutateAsync: connect, isPending, error } = useXConnect();
  const account = useXAccount({ xChainType: "EVM" });
  const disconnect = useXDisconnect();

  if (account.address) {
    const short = `${account.address.slice(0, 6)}…${account.address.slice(-4)}`;
    return (
      <div className="flex items-center gap-3">
        <code className="rounded-md bg-neutral-200/60 px-2 py-1 text-xs font-mono dark:bg-neutral-800/60">
          {short}
        </code>
        <button
          onClick={() => disconnect({ xChainType: "EVM" })}
          className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          Disconnect
        </button>
      </div>
    );
  }

  const installed = connectors.filter((c) => c.isInstalled);
  const list = installed.length > 0 ? installed : connectors.slice(0, 3);

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {list.map((connector) => (
          <button
            key={connector.id}
            onClick={() => connect(connector).catch(() => {})}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
          >
            {connector.icon && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={connector.icon} alt="" width={18} height={18} />
            )}
            {connector.name}
            {!connector.isInstalled && (
              <span className="text-xs text-neutral-500">(not installed)</span>
            )}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-red-500">{error.message}</p>}
    </div>
  );
}
