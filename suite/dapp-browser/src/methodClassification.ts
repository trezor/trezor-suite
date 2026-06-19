import { type Namespace, type RpcLane } from './types';

// Per-namespace JSON-RPC method → router lane classification (§7). Pure and
// React-free: imported by both the renderer router and the desktop host.
// Anything not listed is denied (4200 Unsupported Method) — deny-by-default.

const EIP155_LANES: Record<string, RpcLane> = {
    // state — answered from Suite redux state
    eth_requestAccounts: 'state',
    eth_accounts: 'state',
    eth_chainId: 'state',
    net_version: 'state',
    wallet_switchEthereumChain: 'state',
    wallet_requestPermissions: 'state',
    wallet_getPermissions: 'state',

    // device — on-device confirmation (Invariant 0)
    eth_sendTransaction: 'device',
    personal_sign: 'device',
    eth_signTypedData_v4: 'device',

    // node — read-only JSON-RPC forward
    eth_call: 'node',
    eth_getBalance: 'node',
    eth_estimateGas: 'node',
    eth_gasPrice: 'node',
    eth_maxPriorityFeePerGas: 'node',
    eth_feeHistory: 'node',
    eth_blockNumber: 'node',
    eth_getBlockByNumber: 'node',
    eth_getBlockByHash: 'node',
    eth_getLogs: 'node',
    eth_getCode: 'node',
    eth_getStorageAt: 'node',
    eth_getTransactionCount: 'node',
    eth_getTransactionByHash: 'node',
    eth_getTransactionReceipt: 'node',
    eth_sendRawTransaction: 'node',

    // deny — explicitly unsafe / unsupported (§8)
    eth_sign: 'deny', // blind-hash signing — canonical phishing vector
    wallet_addEthereumChain: 'deny', // static networks; never honour dApp RPC URLs
    eth_signTypedData: 'deny', // legacy v1
    eth_signTypedData_v1: 'deny',
    eth_signTypedData_v3: 'deny', // only v4 is rendered on-device
};

const LANES_BY_NAMESPACE: Partial<Record<Namespace, Record<string, RpcLane>>> = {
    eip155: EIP155_LANES,
};

/**
 * Classify a JSON-RPC method into a router lane for the given namespace.
 * Unknown namespace or unknown method → 'deny' (4200) — deny-by-default.
 */
export const classifyMethod = (namespace: Namespace, method: string): RpcLane =>
    LANES_BY_NAMESPACE[namespace]?.[method] ?? 'deny';
