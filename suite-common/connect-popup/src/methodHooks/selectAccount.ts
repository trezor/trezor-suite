import {
    type AccountType,
    type NetworkSymbol,
    type NetworkType,
    getNetworkOptional,
} from '@suite-common/wallet-config';
import { getAvailableAccountTypes } from '@suite-common/wallet-utils';
import TrezorConnect, { type CallMethodKeys, type CoinInfo } from '@trezor/connect';
import { type SelectionType } from '@trezor/connect-common/src/types/api/selectAccount';

import { connectPopupActions } from '../connectPopupActions';
import { getPermissionDeferred } from '../connectPopupPromiseManager';
import {
    type SelectAccountOptions,
    type SelectAccountTypeTab,
    isUtxoCoinInfo,
} from '../connectPopupTypes';
import { type PostCallHookParams } from './types';

// Default BIP44 account path for a coin Suite has no config for, built from its SLIP-44 coin type.
const bip44AccountPath = (slip44: number) => `m/44'/${slip44}'/i'`;

// Connect's coarse coin category maps to a NetworkType only for bitcoin/ethereum; a `misc` coin
// (ripple, stellar, tron, …) can't be told apart from CoinInfo alone. Every misc coin the picker
// supports is also a Suite coin (resolved via getNetworkOptional before this is reached), so a
// non-Suite misc coin is genuinely unsupported here.
const coinInfoNetworkType = (coinInfo: CoinInfo): NetworkType => {
    if (coinInfo.type === 'bitcoin') return 'bitcoin';
    if (coinInfo.type === 'ethereum') return 'ethereum';

    throw new Error(`selectAccount is not supported for coin ${coinInfo.shortcut}`);
};

// Resolves one of the network's built-in types (bypassing the "publicly available" filter that
// getAvailableAccountTypes applies) — an app explicitly requesting a debug-only type, e.g.
// 'ledger' on eth, should still get it. For a non-Suite coin only the default 'normal' type is
// known; its path is built from the coin's slip44.
const resolveKnownAccountType = (
    symbol: NetworkSymbol,
    accountType: AccountType,
    coinInfo: CoinInfo,
) => {
    const network = getNetworkOptional(symbol);
    if (!network) {
        return accountType === 'normal'
            ? { accountType, bip43Path: bip44AccountPath(coinInfo.slip44) }
            : undefined;
    }
    if (accountType === 'normal') return { accountType, bip43Path: network.bip43Path };

    return network.accountTypes[accountType];
};

// Builds the picker's account-type tabs. Requested entries are either a built-in AccountType name
// or a custom { bip43Path, label } descriptor; unknown/unsupported names are dropped. Falls back
// to the network's full publicly available list (or, for a non-Suite coin, a single slip44-derived
// 'normal' tab) when unrequested or nothing requested survives.
const buildAccountTypeTabs = (
    symbol: NetworkSymbol,
    requested: Array<AccountType | { bip43Path: string; label: string }> | undefined,
    coinInfo: CoinInfo,
): SelectAccountTypeTab[] => {
    const defaultTabs = (): SelectAccountTypeTab[] =>
        getNetworkOptional(symbol)
            ? getAvailableAccountTypes(symbol).map(({ accountType, bip43Path }) => ({
                  key: accountType,
                  accountType,
                  bip43Path,
              }))
            : [
                  {
                      key: 'normal',
                      accountType: 'normal',
                      bip43Path: bip44AccountPath(coinInfo.slip44),
                  },
              ];

    if (!requested?.length) return defaultTabs();

    const tabs = requested
        .map((entry, index): SelectAccountTypeTab | undefined => {
            if (typeof entry === 'string') {
                const known = resolveKnownAccountType(symbol, entry, coinInfo);

                return (
                    known && {
                        key: known.accountType,
                        accountType: known.accountType,
                        bip43Path: known.bip43Path,
                    }
                );
            }

            return { key: `custom-${index}`, bip43Path: entry.bip43Path, customLabel: entry.label };
        })
        .filter((tab): tab is SelectAccountTypeTab => !!tab);

    return tabs.length ? tabs : defaultTabs();
};

// 'single' -> exactly one; 'multi' -> unbounded; an object carries explicit minCount/maxCount.
const resolveSelectionType = (selectionType: SelectionType | undefined) => {
    if (selectionType === undefined || selectionType === 'single') {
        return { selectionType: 'single' as const, minCount: 1, maxCount: 1 };
    }
    const bounds = selectionType === 'multi' ? {} : selectionType;

    return {
        selectionType: 'multi' as const,
        minCount: bounds.minCount ?? 1,
        maxCount: bounds.maxCount,
    };
};

const buildOptions = async (payload: Record<string, any>): Promise<SelectAccountOptions> => {
    const symbol = String(payload.coin).toLowerCase() as NetworkSymbol;
    const { selectionType, minCount, maxCount } = resolveSelectionType(payload.selectionType);

    // Resolve the coin's metadata once here (a picker session is one coin) and persist it in
    // `options`. getCoinInfo is IPC-proxied — Connect's coin data lives in the Electron main
    // process, not importable here. Suite coins take their metadata from wallet-config; coins
    // Connect supports but Suite does not fall back to the fetched CoinInfo.
    const coinInfoResult = await TrezorConnect.getCoinInfo({ coin: symbol });
    if (!coinInfoResult.success) throw new Error(coinInfoResult.error.message);
    const coinInfo = coinInfoResult.payload;
    const network = getNetworkOptional(symbol);

    const isUtxo = isUtxoCoinInfo(coinInfo);
    const networkType = network?.networkType ?? coinInfoNetworkType(coinInfo);
    const decimals = network?.decimals ?? coinInfo.decimals;

    // Normalize the default so every downstream check compares against a concrete literal instead
    // of `undefined` — irrelevant (and left undefined) for account-based networks.
    const addressSelection = isUtxo ? (payload.addressSelection ?? 'fullAccount') : undefined;

    return {
        symbol,
        selectionType,
        minCount,
        maxCount,
        isUtxo,
        networkType,
        decimals,
        accountTypeTabs: buildAccountTypeTabs(symbol, payload.accountType, coinInfo),
        mode: addressSelection === 'fullAccount' ? 'xpub' : 'address',
        addressSelection,
        requireOnDeviceVerification: payload.requireOnDeviceVerification ?? true,
    };
};

// Drives the `selectAccount` picker. The Connect method itself is a no-op that returns immediately,
// so by the time this runs the call has already returned — which is what makes it safe for the
// picker to fire nested Connect calls (deriving new indices, verifying addresses on device) without
// colliding with an in-flight call. We keep the call "ongoing" by blocking on getPermissionDeferred,
// which connectPopupResolveSelectAccountThunk resolves (confirm) or rejects (cancel).
async function postCallHook<M extends CallMethodKeys>({
    method,
    originalPayload,
    response,
    dispatch,
}: PostCallHookParams<M>) {
    if (method !== 'selectAccount' || !response.success) return false;

    const options = await buildOptions(originalPayload);

    dispatch(
        connectPopupActions.selectAccount({
            options,
            // accountTypeTabs is guaranteed non-empty by buildAccountTypeTabs
            selectedAccountTypeKey: options.accountTypeTabs[0]!.key,
            candidates: [],
            page: 0,
            // 'manual' starts by picking which account to browse; every other mode has no such
            // drill-in step.
            manualPhase: options.addressSelection === 'manual' ? 'account' : undefined,
            exported: false,
        }),
    );

    // Block until the user connects. connectPopupResolveSelectAccountThunk delivers the selection to
    // the app, flips the picker into its `exported` phase (keeping the modal open so the user can
    // still verify the exported addresses on device, like ConnectAddressConfirmation), and resolves
    // this deferred. A cancel rejects it instead, which the call thunk maps to Method_Cancel.
    await getPermissionDeferred(true).promise;

    return true;
}

export const selectAccountHooks = { postCallHook };
