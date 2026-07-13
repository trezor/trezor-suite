import { type AccountType, type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { type AccountKey, type TxSimulationAction } from '@suite-common/wallet-types';
import { type CallMethodKeys, type PermissionRequest } from '@trezor/connect';
import { type SerializedError } from '@trezor/connect-common/src/constants/errors';
import { type AddressSelection } from '@trezor/connect-common/src/types/api/selectAccount';

// UTXO coins have accounts with many addresses (mirrors `isUtxoBased` in
// wallet-utils/accountUtils, which operates on an already-loaded `Account` instead of a symbol) —
// `selectAccount`'s `addressSelection`/xpub-vs-address distinction only applies to them.
export const isUtxoNetwork = (symbol: NetworkSymbol) => {
    const { networkType } = getNetwork(symbol);

    return networkType === 'bitcoin' || networkType === 'cardano';
};

export type ManifestPartial = {
    appName: string;
    appIcon?: string;
    appUrl?: string;
    email?: string;
    npmVersion?: string;
};

export const CALL_SOURCE_DESKTOP_WS = 'desktop-ws';
export const CALL_SOURCE_MCP = 'mcp';
export const CALL_SOURCE_WEB = 'web';
export const CALL_SOURCE_WALLETCONNECT = 'walletconnect';
export const CALL_SOURCE_DEEPLINK = 'deeplink';

export type ConnectSerializedError = SerializedError;
export type ConnectProcessInfo = {
    name: string;
    fullPath: string;
    icon?: string;
    warning: boolean;
};
export type ConnectCallSource = {
    origin: string;
    // Permissions the host declared up front (via ConnectSettings.requestedPermissions), carried on
    // the handshake. Sanitized in connectPopupCallThunkInner so the first consent covers the set.
    requestedPermissions?: PermissionRequest[];
} & (
    | {
          type: typeof CALL_SOURCE_DESKTOP_WS;
          process: ConnectProcessInfo;
          manifest: ManifestPartial;
      }
    | {
          type: typeof CALL_SOURCE_MCP;
          process?: ConnectProcessInfo;
          manifest: ManifestPartial;
      }
    | {
          type: typeof CALL_SOURCE_WALLETCONNECT;
          process?: undefined;
          manifest: ManifestPartial;
      }
    | {
          type: typeof CALL_SOURCE_WEB;
          process?: undefined;
          manifest: ManifestPartial;
      }
    | {
          type: typeof CALL_SOURCE_DEEPLINK;
          process?: undefined;
          manifest: ManifestPartial;
      }
);

type SelectedFee =
    | {
          gasPrice: undefined;
          maxFeePerGas: string;
          maxPriorityFeePerGas: string;
          gasLimit: string;
      }
    | {
          gasPrice: string;
          maxFeePerGas: undefined;
          maxPriorityFeePerGas: undefined;
          gasLimit: string;
      };

// One account-type tab offered by the `selectAccount` picker. `accountType` is set when the tab
// is one of the network's built-in types (see networksConfig); custom tabs (arbitrary bip43Path
// requested by the app) have no `accountType` and carry their own display label instead.
export type SelectAccountTypeTab = {
    key: string;
    bip43Path: string;
    accountType?: AccountType;
    customLabel?: string;
};

// A single row in the `selectAccount` picker. The host (Suite) owns this list: existing accounts
// come from Redux discovery, new/arbitrary indices are derived on demand.
//
// In `options.mode === 'xpub'` (UTXO, `addressSelection` omitted or 'fullAccount') a row is one
// BIP44 account, identified by `xpub`. In `options.mode === 'address'` a row is one individual
// address (`address`) — either the account itself (account-based networks, and UTXO
// `addressSelection: 'firstFresh'`, one row per BIP44 account index) or one of the chosen
// account's previously-used addresses (UTXO `addressSelection: 'manual'`, `manualPhase ===
// 'address'` — one row per used address, and `accountIndex` is then the index into that
// used-address list, not a BIP44 account index). `addressSelection: 'manual'`'s account-picking
// phase (`manualPhase === 'account'`) reuses the same account-index rows as
// `mode === 'address'`/`'firstFresh'`, but never populates `address`/`xpub` on them — picking one
// is a drill-in, not an export.
export type SelectAccountCandidate = {
    symbol: NetworkSymbol;
    accountIndex: number;
    accountTypeKey: string; // SelectAccountTypeTab.key of the tab this row belongs to
    path: string; // serialized derivation path of the address/account
    address?: string; // mutually exclusive with `xpub`
    xpub?: string; // mutually exclusive with `address` — set only in `options.mode === 'xpub'`
    balance?: string; // formatted crypto amount
    used: boolean; // has on-chain history
    selected: boolean;
    loading: boolean; // deriving address/xpub/balance
    loadFailed: boolean; // derivation failed
    verifying: boolean; // on-device verification in progress
    validated: 'valid' | 'failed' | 'not-started';
    mac?: string; // SLIP-0019 address MAC captured during verification (`address` rows only)
};

export const SELECT_ACCOUNT_PAGE_SIZE = 5;

// Picker options derived from the `selectAccount` method params (by its methodHook).
export type SelectAccountOptions = {
    symbol: NetworkSymbol;
    selectionType: 'single' | 'multi';
    accountTypeTabs: SelectAccountTypeTab[]; // at least one
    // Resolved once from `addressSelection` + the coin's network type (see SelectAccountCandidate).
    mode: 'xpub' | 'address';
    // Normalized: 'fullAccount' when the coin is UTXO-based and the param was omitted or explicit;
    // undefined only for account-based networks, where `addressSelection` is ignored entirely.
    addressSelection?: AddressSelection;
    requireOnDeviceVerification: boolean;
    minCount: number;
    maxCount?: number;
};

type TxSimulationConnectPopupCallLoaded = {
    state: 'tx-simulation';
    selectedAccountKey?: AccountKey;
} & Omit<TxSimulationAction, 'sourceOrigin'>;

type ConnectPopupCallLoaded = {
    // Common properties that are always present
    methodInfo: {
        methodTitle: string;
        confirmLabel?: string;
        permissionTypes: PermissionRequest[];
        useUi: boolean;
    };
    source: ConnectCallSource;
    selectedFee?: SelectedFee;
} & (
    | {
          method: CallMethodKeys;
          state: 'ongoing';
          selectedAccountKey?: AccountKey;
          payload: any;
      }
    | {
          method: CallMethodKeys;
          state: 'finished';
          payload: any;
      }
    | {
          method: CallMethodKeys;
          state: 'permission-request';
          payload: any;
      }
    | {
          method: CallMethodKeys;
          state: 'deeplink-callback';
          callbackUrl: string;
          payload: any;
      }
    | {
          method: CallMethodKeys;
          state: 'address-confirmation';
          exported: boolean;
          addresses: {
              address: string;
              loading: boolean;
              validated: 'valid' | 'failed' | 'not-started';
              validatePayload: any;
          }[];
          payload: any;
      }
    | {
          method: CallMethodKeys;
          state: 'select-account';
          payload: any;
          options: SelectAccountOptions;
          selectedAccountTypeKey: string; // options.accountTypeTabs[n].key of the active tab
          page: number;
          candidates: SelectAccountCandidate[];
          // Total number of candidates, when finite (UTXO `addressSelection: 'manual'`, bounded by
          // the account's used-address count). Undefined elsewhere — accounts can always be
          // derived further, so there's no last page.
          totalCandidates?: number;
          // UTXO `addressSelection: 'manual'` only: a two-phase flow — pick an account, then pick
          // one of its addresses. Undefined for every other mode (no account-drill-in phase).
          manualPhase?: 'account' | 'address';
          // Set once `manualPhase === 'address'`: the BIP44 index of the account chosen in the
          // 'account' phase, whose used addresses are now being listed.
          manualAccountIndex?: number;
          // false while selecting, true once the selection has been sent to the app; in the
          // exported phase the modal stays open so the user can keep verifying on device.
          exported: boolean;
          // Two guards keep the picker's page loads from stepping on each other, at different
          // layers (see connectPopupLoadSelectAccountPageThunk):
          //  - loadingKey dedups loads of the *same* view (phase/tab/account/page): a second one is
          //    a no-op, so an identical device round-trip is never issued twice. It is the key of
          //    the currently running load, cleared when that load settles.
          //  - loadEpoch resolves the write race between loads of *different* views that overlap
          //    (page/tab/phase/account changed mid-load): each load stamps a fresh epoch and, after
          //    every await, bails when a newer load has superseded it — dimension-agnostic
          //    latest-wins, so a stale load can never paint over the current view.
          // Both are transient activeCall state, undefined until the first load runs. See #29662.
          loadingKey?: string;
          loadEpoch?: number;
      }
    | {
          method: CallMethodKeys;
          state: 'call-error';
          error: ConnectSerializedError;
          payload: any;
      }
    | TxSimulationConnectPopupCallLoaded
    | {
          method: CallMethodKeys;
          state: 'switch-device';
          timestamp: number;
          payload: any;
      }
);

type ConnectPopupCallError = {
    state: 'error';
    error: ConnectSerializedError;
};
export type ConnectPopupCall = ConnectPopupCallLoaded | ConnectPopupCallError;

export type ConnectPopupCallWithState<
    CallState extends ConnectPopupCall['state'],
    Method extends ConnectPopupCallLoaded['method'] = ConnectPopupCallLoaded['method'],
> = Extract<ConnectPopupCallLoaded, { state: CallState; method: Method }>;

export type AppRememberedPermission = {
    allowedPermissions: PermissionRequest[];
    silentMode?: boolean;
} & ConnectCallSource;
