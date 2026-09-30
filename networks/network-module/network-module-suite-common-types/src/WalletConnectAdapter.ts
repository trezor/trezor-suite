import type {
    AccountAddresses,
    AccountUtxo,
    CallMethodKeys,
    CallMethodParams,
    CallMethodResponse,
    ERRORS,
    PROTO,
} from '@trezor/connect-common';
import type { Result } from '@trezor/type-utils';

/** An account the app can offer to a dApp, reduced to what network modules read. */
export type WalletConnectAccount<TSymbol extends string> = {
    symbol: TSymbol;
    descriptor: string;
    path: string;
    visible: boolean;
    addresses?: AccountAddresses;
    utxo?: AccountUtxo[];
    unlockPath?: PROTO.UnlockPath;
    /** Keeps the backend connection of the account apart from other wallets (Connect `identity`). */
    identity: string;
};

/** A JSON-RPC request that a dApp sent over a WalletConnect session. */
export type WalletConnectRequest = {
    method: string;
    /** The method owns the shape, so each module reads the params of its own methods. */
    params: unknown;
    /** CAIP-2 chain ID that the dApp addressed. */
    chainId: string;
};

type DistributiveOmit<T, K extends keyof T> = T extends T ? Omit<T, K> : never;

export type WalletConnectCallDeviceResult<TMethod extends CallMethodKeys> = Result<
    CallMethodResponse<TMethod>,
    ERRORS.SerializedError
>;

/** Runs a Connect call on the selected device after the user confirms it in the popup. */
export type WalletConnectCallDevice = <TMethod extends CallMethodKeys>(
    method: TMethod,
    payload: DistributiveOmit<CallMethodParams<TMethod>, 'method'>,
) => Promise<WalletConnectCallDeviceResult<TMethod>>;

/** What the app provides for one request: its state and the calls that need the user. */
export type WalletConnectRequestContext<TSymbol extends string> = {
    request: WalletConnectRequest;

    /** All accounts of the module networks, also the hidden ones: each method decides. */
    accounts: readonly WalletConnectAccount<TSymbol>[];

    /** Network of the account that the user last selected for the session. */
    sessionSymbol: TSymbol | undefined;

    callDevice: WalletConnectCallDevice;

    /** Next nonce of an account-based network account, after its pending transactions. */
    resolveNonce(account: WalletConnectAccount<TSymbol>): Promise<string>;

    /** The user wants transactions broadcast through MEV-protected RPC. */
    isMevProtectionEnabled: boolean;
};

/**
 * The WalletConnect side of a network: its CAIP namespace and the JSON-RPC methods of that
 * namespace.
 *
 * Optional on a network module: a network without an adapter is not offered to dApps.
 */
export type WalletConnectAdapter<TSymbol extends string> = {
    /** CAIP-2 namespace, for example `eip155`. */
    namespaceId: string;

    methods: readonly string[];

    events: readonly string[];

    /** CAIP-2 chain IDs of the network; empty when WalletConnect has no ID for it. */
    getChainIds(symbol: TSymbol): readonly string[];

    /** Address that the dApp sees for the account; `undefined` when it cannot be offered. */
    getAccountAddress(account: WalletConnectAccount<TSymbol>): string | undefined;

    /** Resolves to the JSON-RPC result. A rejection answers the dApp with an error. */
    handleRequest(context: WalletConnectRequestContext<TSymbol>): Promise<unknown>;
};
