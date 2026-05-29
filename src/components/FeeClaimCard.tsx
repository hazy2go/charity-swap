"use client";

import { useState } from "react";
import { formatUnits } from "viem";
import { ChainKeys } from "@sodax/sdk";
import {
  useFetchAssetsBalances,
  useGetAutoSwapPreferences,
  useSetSwapPreference,
  useApproveToken,
  useFeeClaimSwap,
  useSodaxContext,
} from "@sodax/dapp-kit";
import { useXAccount, useWalletProvider, useEvmSwitchChain } from "@sodax/wallet-sdk-react";

// Fees accrue to the charity wallet on the Sonic hub as a basket of wrapped
// ERC-20s (one per token people swapped FROM). Only that wallet can claim
// them — the admin wallet has no power over funds it doesn't own. So this
// card is gated to the charity wallet and signs on Sonic. Claiming converts
// the whole basket into USDC on Sonic, back to the charity wallet.
const CHARITY_WALLET = (
  process.env.NEXT_PUBLIC_CHARITY_FEE_ADDRESS ??
  "0x95A8E0BcF616f7eF630b0D923667fbF52AA721AD"
).toLowerCase();
const SONIC = ChainKeys.SONIC_MAINNET;
const SONIC_USDC = "0x29219dd400f2Bf60E5a23d13Be72B486D4038894" as `0x${string}`;

export function FeeClaimCard() {
  const evm = useXAccount({ xChainType: "EVM" });
  const connected = evm.address;
  const isCharity = !!connected && connected.toLowerCase() === CHARITY_WALLET;
  const walletProvider = useWalletProvider({ xChainId: SONIC });
  const { sodax } = useSodaxContext();
  // Claiming signs on Sonic — a wallet on the wrong network would broadcast
  // there as a no-op. Force it onto Sonic first.
  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain({ xChainId: SONIC });
  const needsChainSwitch = isCharity && isWrongChain;

  const queryAddress = isCharity ? connected : undefined;
  const { data: basket, isLoading: basketLoading, refetch: refetchBasket } =
    useFetchAssetsBalances({ params: { queryAddress } });
  const { data: prefs, refetch: refetchPrefs } = useGetAutoSwapPreferences({
    params: { queryAddress },
  });

  const { mutateAsync: setPref } = useSetSwapPreference();
  const { mutateAsync: approveToken } = useApproveToken();
  const { mutateAsync: claimSwap } = useFeeClaimSwap();

  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const push = (m: string) => setLog((l) => [...l, m]);

  const prefConfigured =
    !!prefs &&
    prefs.outputToken?.toLowerCase() === SONIC_USDC.toLowerCase() &&
    prefs.dstChainKey === SONIC;

  const assets = basket
    ? [...basket.values()].filter((a) => a.balance > 0n)
    : [];

  async function configurePreference() {
    if (!walletProvider || !connected) return;
    setErr(null);
    setBusy(true);
    try {
      await setPref({
        params: {
          srcChainKey: SONIC,
          srcAddress: connected as `0x${string}`,
          outputToken: SONIC_USDC,
          dstChainKey: SONIC,
          dstAddress: connected,
        },
        walletProvider,
      });
      push("Output preference set → USDC on Sonic, to the charity wallet.");
      await refetchPrefs();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function claimAll() {
    if (!walletProvider || !connected) return;
    setErr(null);
    setBusy(true);
    setLog([]);
    try {
      if (!prefConfigured) {
        setErr("Set the output preference first.");
        return;
      }
      if (assets.length === 0) {
        push("Nothing accrued to claim.");
        return;
      }
      for (const a of assets) {
        const human = Number(formatUnits(a.balance, a.decimal));
        push(`Claiming ${human.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${a.symbol}…`);
        // Approve the hub token for the ProtocolIntents contract if needed.
        const approvedRes = await sodax.partners.feeClaim.isTokenApproved({
          srcChainKey: SONIC,
          srcAddress: connected as `0x${string}`,
          token: a.address,
        });
        const approved = approvedRes.ok ? approvedRes.value : false;
        if (!approved) {
          push(`  · approving ${a.symbol}…`);
          await approveToken({
            params: {
              srcChainKey: SONIC,
              srcAddress: connected as `0x${string}`,
              token: a.address,
            },
            walletProvider,
          });
        }
        await claimSwap({
          params: {
            srcChainKey: SONIC,
            srcAddress: connected as `0x${string}`,
            fromToken: a.address,
            amount: a.balance,
          },
          walletProvider,
        });
        push(`  ✓ ${a.symbol} → USDC`);
      }
      push("Done. Refreshing accrued balances…");
      await refetchBasket();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="vh-card">
      <div className="vh-card__head">
        <span className="vh-eyebrow" style={{ color: "var(--vh-magenta-500)" }}>
          Fee claim · charity treasury
        </span>
        <span style={{ marginLeft: "auto" }} className="vh-pill vh-pill--mag">
          Sonic hub
        </span>
      </div>

      <div className="vh-card__body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {!connected ? (
          <Note>Connect the charity wallet to claim accrued fees.</Note>
        ) : !isCharity ? (
          <Note tone="warn">
            Connected wallet is <code style={{ color: "var(--vh-cyan-500)" }}>{connected}</code>.
            Fees are owned by the charity wallet{" "}
            <code style={{ color: "var(--vh-magenta-500)" }}>0x95A8…721AD</code> — only it can
            claim. Connect that wallet on Sonic.
          </Note>
        ) : needsChainSwitch ? (
          <>
            <Note tone="warn">
              Your wallet is on the wrong network. Claiming signs on{" "}
              <strong>Sonic</strong> — switch first.
            </Note>
            <button
              type="button"
              className="vh-btn vh-btn--primary vh-btn--block"
              onClick={() => {
                try { handleSwitchChain(); } catch { /* user rejected */ }
              }}
            >
              Switch wallet to Sonic
            </button>
          </>
        ) : (
          <>
            <p className="vh-body" style={{ fontSize: 13, color: "var(--vh-text-3)" }}>
              Fees accrue as a basket of hub tokens. Claiming converts the whole basket into{" "}
              <strong style={{ color: "var(--vh-text)" }}>USDC on Sonic</strong>, sent back to this
              wallet. Each token is one approve (first time) + one claim transaction.
            </p>

            {/* Accrued basket */}
            <div>
              <div className="vh-eyebrow" style={{ marginBottom: 8 }}>
                Accrued{basketLoading ? " · loading…" : ` · ${assets.length} token${assets.length === 1 ? "" : "s"}`}
              </div>
              {assets.length === 0 && !basketLoading ? (
                <div className="vh-mono" style={{ fontSize: 12, color: "var(--vh-text-3)" }}>
                  Nothing accrued yet.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {assets.map((a) => (
                    <div
                      key={a.address}
                      className="vh-mono"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 8,
                        fontSize: 12,
                        padding: "6px 10px",
                        background: "var(--vh-s2)",
                        border: "1px solid var(--vh-line)",
                        borderRadius: "var(--vh-r)",
                      }}
                    >
                      <span style={{ color: "var(--vh-text)" }}>
                        {a.symbol}{" "}
                        <span style={{ color: "var(--vh-text-4)" }}>· from {a.originalChain}</span>
                      </span>
                      <span style={{ color: "var(--vh-cyan-500)" }}>
                        {Number(formatUnits(a.balance, a.decimal)).toLocaleString(undefined, {
                          maximumFractionDigits: 6,
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Preference */}
            <div
              className="vh-mono"
              style={{ fontSize: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}
            >
              <span style={{ color: "var(--vh-text-3)" }}>
                Output:{" "}
                {prefConfigured ? (
                  <span style={{ color: "var(--vh-acid-500)" }}>USDC on Sonic ✓</span>
                ) : (
                  <span style={{ color: "var(--vh-amber-500)" }}>not configured</span>
                )}
              </span>
              {!prefConfigured && (
                <button
                  type="button"
                  className="vh-btn vh-btn--ghost vh-btn--xs"
                  disabled={busy || !walletProvider}
                  onClick={configurePreference}
                >
                  Set output → USDC
                </button>
              )}
            </div>

            <button
              type="button"
              className="vh-btn vh-btn--primary vh-btn--block"
              disabled={busy || !walletProvider || assets.length === 0 || !prefConfigured}
              onClick={() => {
                if (confirm(`Claim ${assets.length} token(s) → USDC to the charity wallet?`)) {
                  void claimAll();
                }
              }}
            >
              {busy ? "Claiming…" : `Claim all → USDC (${assets.length})`}
            </button>

            {log.length > 0 && (
              <pre
                className="vh-mono"
                style={{
                  margin: 0,
                  fontSize: 11,
                  lineHeight: 1.6,
                  color: "var(--vh-text-2)",
                  background: "var(--vh-inset)",
                  border: "1px solid var(--vh-line)",
                  borderRadius: "var(--vh-r)",
                  padding: "8px 10px",
                  whiteSpace: "pre-wrap",
                  maxHeight: 180,
                  overflow: "auto",
                }}
              >
                {log.join("\n")}
              </pre>
            )}
            {err && (
              <div
                style={{
                  padding: 10,
                  border: "1px solid var(--vh-magenta-soft)",
                  background: "var(--vh-magenta-soft)",
                  color: "var(--vh-magenta-500)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                }}
              >
                <strong>ERR · </strong>
                {err}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Note({ children, tone }: { children: React.ReactNode; tone?: "warn" }) {
  return (
    <div
      style={{
        padding: 12,
        border: `1px solid ${tone === "warn" ? "var(--vh-amber-500)" : "var(--vh-cyan-soft)"}`,
        background: tone === "warn" ? "var(--vh-yellow-soft)" : "var(--vh-cyan-soft)",
        color: tone === "warn" ? "var(--vh-amber-500)" : "var(--vh-cyan-500)",
        fontFamily: "var(--font-mono)",
        fontSize: 13,
        lineHeight: 1.5,
      }}
    >
      {children}
    </div>
  );
}
