import {
    type AccountType,
    type NetworkSymbol,
    getNetwork,
    isNetworkSymbol,
} from '@suite-common/wallet-config';
import { getAvailableAccountTypes } from '@suite-common/wallet-utils';
import { TypedError } from '@trezor/connect-common/src/constants/errors';
import { type SelectionType } from '@trezor/connect-common/src/types/api/selectAccount';

import {
    CommonPopupFlow,
    type PopupFlowAnswer,
    type PopupFlowPayload,
    type PopupFlowResponse,
    type PopupFlowThunkApi,
} from './CommonPopupFlow';
import { connectPopupActions } from '../connectPopupActions';
import { getPermissionDeferred } from '../connectPopupPromiseManager';
import { selectConnectPopupCallWithState } from '../connectPopupReducer';
import {
    type ConnectPopupCallWithState,
    type SelectAccountOptions,
    type SelectAccountTypeTab,
    isUtxoNetwork,
} from '../connectPopupTypes';

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

export const buildOptions = (payload: PopupFlowPayload<'selectAccount'>): SelectAccountOptions => {
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

// Shows the account picker, either fresh or as it was left, and resolves to its state once the user
// has confirmed the selection. A cancel rejects instead, which the call flow maps to Method_Cancel.
export const pickAccounts = async (
    { dispatch, getState }: PopupFlowThunkApi,
    options: SelectAccountOptions,
    previousPicker?: ConnectPopupCallWithState<'select-account'>,
) => {
    // Resolved by connectPopupResolveSelectAccountThunk, or connectPopupSelectManualAccountThunk for
    // an account-only picker.
    const pickerDeferred = getPermissionDeferred(true);
    dispatch(
        connectPopupActions.selectAccount(
            previousPicker ?? {
                options,
                // accountTypeTabs is guaranteed non-empty by buildAccountTypeTabs
                selectedAccountTypeKey: options.accountTypeTabs[0]!.key,
                candidates: [],
                page: 0,
                // 'manual' starts by picking which account to browse; every other mode has no such
                // drill-in step.
                manualPhase: options.addressSelection === 'manual' ? 'account' : undefined,
                exported: false,
            },
        ),
    );
    await pickerDeferred.promise;

    return selectConnectPopupCallWithState(getState(), 'select-account');
};

export class SelectAccount extends CommonPopupFlow<'selectAccount'> {
    // Reject a coin Suite cannot render before the permissions modal, so the user isn't asked to
    // grant access to a coin that would only crash buildOptions afterwards. Connect's `__info` call
    // already rejected unknown/typo'd coins with Method_UnknownCoin, so a non-network symbol here is
    // a Connect-valid coin this host cannot render — hence a distinct code the caller can act on.
    protected validate() {
        const symbol = String(this.payload.coin).toLowerCase();
        if (!isNetworkSymbol(symbol)) {
            throw TypedError('Method_UnsupportedCoinForHost');
        }
    }

    // Drives the `selectAccount` picker. The Connect method itself is a no-op that returns
    // immediately, so by the time the picker shows the call has already returned — which is what
    // makes it safe for the picker to fire nested Connect calls (deriving new indices, verifying
    // addresses on device) without colliding with an in-flight call.
    protected async callMethod(payload: PopupFlowPayload<'selectAccount'>) {
        const response = await super.callMethod(payload);
        if (!response.success) return response;

        const options = buildOptions(this.payload);
        const { dispatch, getState } = this;
        const picker = await pickAccounts({ dispatch, getState }, options);
        const candidates = picker?.candidates ?? [];

        // Always an array, even for a 'single' selection — mirrors eth_requestAccounts. `address`
        // and `xpub` are mutually exclusive per candidate (see SelectAccountCandidate).
        return {
            success: true,
            payload: candidates
                .filter(c => c.selected && (c.address || c.xpub))
                .map(c => ({
                    symbol: c.symbol,
                    path: c.path,
                    address: c.address,
                    xpub: c.xpub,
                    // undefined for custom (non-built-in) account-type tabs — no real AccountType
                    accountType: options.accountTypeTabs.find(tab => tab.key === c.accountTypeKey)
                        ?.accountType,
                    mac: c.mac,
                })),
        } as PopupFlowAnswer;
    }

    // Keeps the picker open in its `exported` phase, so the user can keep verifying the exported
    // addresses on device (mirrors ConnectAddressConfirmation).
    protected postCall(response: PopupFlowResponse<'selectAccount'>) {
        if (!response.success) return false;

        this.dispatch(connectPopupActions.updateSelectAccount({ exported: true }));

        return true;
    }
}
