import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type WalletAssetKey,
    getWalletAssetKey,
    selectAccountByKey,
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectEnabledNetworks,
    selectIsTokenFiatRateDisallowed,
} from '@suite-common/wallet-core';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import { getFiatRateKey, isTestnet } from '@suite-common/wallet-utils';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';

import {
    type HomeAssetTableState,
    selectShownWalletAssetKeys,
    selectWalletAssetContractAddress,
    selectWalletAssetFiatValue,
    selectWalletAssetNetworkSymbol,
} from './homeAssetTableSelectors';

const createMemoizedSelector = createWeakMapSelector.withTypes<HomeAssetTableState>();

const selectAccountAlone = createMemoizedSelector(
    [(state: HomeAssetTableState, accountKey: AccountKey) => selectAccountByKey(state, accountKey)],
    (account): Account[] => returnStableArrayIfEmpty(account === null ? [] : [account]),
);

const selectEnabledNetworksWith = createMemoizedSelector(
    [
        selectEnabledNetworks,
        (_state: HomeAssetTableState, networkSymbol: NetworkSymbol) => networkSymbol,
    ],
    (enabledNetworks, networkSymbol): NetworkSymbol[] =>
        enabledNetworks.includes(networkSymbol)
            ? enabledNetworks
            : [...enabledNetworks, networkSymbol],
);

/**
 * The state as it is, with the wallet narrowed to one account, so the Home asset table selectors
 * answer for that account alone. Every other slice is the same object, so their caches still hit.
 */
export const selectAccountAssetTableState = createMemoizedSelector(
    [(state: HomeAssetTableState) => state, selectAccountAlone],
    (state, accounts): HomeAssetTableState => {
        const [account] = accounts;
        const { settings } = state.wallet;
        const enabledNetworks =
            account === undefined
                ? settings.enabledNetworks
                : selectEnabledNetworksWith(state, account.symbol);

        return {
            ...state,
            wallet: {
                ...state.wallet,
                accounts,
                settings:
                    enabledNetworks === settings.enabledNetworks
                        ? settings
                        : { ...settings, enabledNetworks },
            },
        };
    },
);

export const selectAccountCoinAssetKey = createMemoizedSelector(
    [(state: HomeAssetTableState, accountKey: AccountKey) => selectAccountByKey(state, accountKey)],
    account =>
        account === null
            ? undefined
            : getWalletAssetKey({
                  deviceState: account.deviceState,
                  networkSymbol: account.symbol,
                  contractAddress: undefined,
              }),
);

/**
 * Whether the asset's missing rate is still on its way. A testnet is never priced, a token whose
 * rate is not fetched never gets one, and a failed fetch has given up, so none of them is waited for.
 */
const isAssetRatePending = (state: HomeAssetTableState, assetKey: WalletAssetKey) => {
    const networkSymbol = selectWalletAssetNetworkSymbol(state, assetKey);
    const contractAddress = selectWalletAssetContractAddress(state, assetKey);

    return (
        networkSymbol !== undefined &&
        !isTestnet(networkSymbol) &&
        !selectIsTokenFiatRateDisallowed(state, networkSymbol, contractAddress) &&
        !selectCurrentFiatRates(state)?.[
            getFiatRateKey(networkSymbol, selectBaseCurrency(state), contractAddress)
        ]?.error
    );
};

const isAssetUnpriced = (state: HomeAssetTableState, assetKey: WalletAssetKey) =>
    selectWalletAssetFiatValue(state, assetKey) === undefined;

/** Whether a rate the table still lacks is on its way, so its total is worth waiting for. */
export const selectIsAssetTableRatePending = (state: HomeAssetTableState) =>
    selectShownWalletAssetKeys(state).some(
        assetKey => isAssetUnpriced(state, assetKey) && isAssetRatePending(state, assetKey),
    );

/**
 * Whether the total leaves out a held asset that has no rate to come. One still on its way is
 * not counted: the total is only short of it until it lands.
 */
export const selectIsAssetTableTotalIncomplete = (state: HomeAssetTableState) => {
    const assetKeys = selectShownWalletAssetKeys(state);

    return (
        assetKeys.some(assetKey => !isAssetUnpriced(state, assetKey)) &&
        assetKeys.some(
            assetKey => isAssetUnpriced(state, assetKey) && !isAssetRatePending(state, assetKey),
        )
    );
};
