import {
    type AccountType,
    type NetworkSymbol,
    getNetwork,
    isNetworkSymbol,
} from '@suite-common/wallet-config';
import { getAvailableAccountTypes } from '@suite-common/wallet-utils';
import { type CallMethodKeys } from '@trezor/connect';
import { TypedError } from '@trezor/connect-common/src/constants/errors';
import { type SelectionType } from '@trezor/connect-common/src/types/api/selectAccount';

import { connectPopupActions } from '../connectPopupActions';
import { getPermissionDeferred } from '../connectPopupPromiseManager';
import {
    type SelectAccountOptions,
    type SelectAccountTypeTab,
    isUtxoNetwork,
} from '../connectPopupTypes';
import { type PostCallHookParams, type PreCallHookParams } from './types';

// Resolves one of the network's built-in types (bypassing the "publicly available" filter that
// getAvailableAccountTypes applies) — an app explicitly requesting a debug-only type, e.g.
// 'ledger' on eth, should still get it.
const resolveKnownAccountType = (symbol: NetworkSymbol, accountType: AccountType) => {
    const network = getNetwork(symbol);
    if (accountType === 'normal') return { accountType, bip43Path: network.bip43Path };

    return network.accountTypes[accountType];
};

// Builds the picker's account-type tabs. Requested entries are either a built-in AccountType name
// or a custom { bip43Path, label } descriptor; unknown/unsupported names are dropped. Falls back
// to the network's full publicly available list when unrequested or nothing requested survives.
const buildAccountTypeTabs = (
    symbol: NetworkSymbol,
    requested: Array<AccountType | { bip43Path: string; label: string }> | undefined,
): SelectAccountTypeTab[] => {
    const defaultTabs = () =>
        getAvailableAccountTypes(symbol).map(({ accountType, bip43Path }) => ({
            key: accountType,
            accountType,
            bip43Path,
        }));

    if (!requested?.length) return defaultTabs();

    const tabs = requested
        .map((entry, index): SelectAccountTypeTab | undefined => {
            if (typeof entry === 'string') {
                const known = resolveKnownAccountType(symbol, entry);

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

const buildOptions = (payload: Record<string, any>): SelectAccountOptions => {
    const symbol = String(payload.coin).toLowerCase() as NetworkSymbol;
    const { selectionType, minCount, maxCount } = resolveSelectionType(payload.selectionType);
    // Normalize the default so every downstream check compares against a concrete literal instead
    // of `undefined` — irrelevant (and left undefined) for account-based networks.
    const addressSelection = isUtxoNetwork(symbol)
        ? (payload.addressSelection ?? 'fullAccount')
        : undefined;

    return {
        symbol,
        selectionType,
        minCount,
        maxCount,
        accountTypeTabs: buildAccountTypeTabs(symbol, payload.accountType),
        mode: addressSelection === 'fullAccount' ? 'xpub' : 'address',
        addressSelection,
        requireOnDeviceVerification: payload.requireOnDeviceVerification ?? true,
    };
};

// Reject a coin Suite cannot render before the permissions modal, so the user isn't asked to grant
// access to a coin that would only crash buildOptions afterwards. Connect's `__info` call already
// rejected unknown/typo'd coins with Method_UnknownCoin, so a non-network symbol here is a
// Connect-valid coin this host cannot render — hence a distinct code the caller can act on.
const validateHook = <M extends CallMethodKeys>({
    method,
    payload,
}: Pick<PreCallHookParams<M>, 'method' | 'payload'>) => {
    if (method !== 'selectAccount') return;

    const symbol = String((payload as Record<string, any>).coin).toLowerCase();
    if (!isNetworkSymbol(symbol)) {
        throw TypedError('Method_UnsupportedCoinForHost');
    }
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

    const options = buildOptions(originalPayload);

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

export const selectAccountHooks = { validateHook, postCallHook };
