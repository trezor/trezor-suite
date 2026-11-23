import {
    DefinitionType,
    TokenManagementAction,
    tokenDefinitionsActions,
} from '@suite-common/token-definitions';
import { type AccountKey } from '@suite-common/wallet-types';
import {
    enhanceTokens,
    findToken,
    getContractAddressForNetworkSymbol,
    tryGetAccountIdentity,
} from '@suite-common/wallet-utils';
import TrezorConnect, { type TokenInfo } from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';
import { createThunk } from '@trezor/redux-utils';

import { type CustomTokenFetchError, isSupportedCustomToken } from './customTokenUtils';
import { customTokensActions } from './customTokensSlice';
import { accountsActions } from '../accounts/accountsActions';
import { type AccountsRootState } from '../accounts/accountsReducer';
import { selectAccountByKey } from '../accounts/accountsSelectors';

const CUSTOM_TOKEN_MODULE_PREFIX = '@common/wallet-core/custom-token';

const FETCH_TIMEOUT_MS = 15_000;

type CustomTokenThunkPayload = { accountKey: AccountKey; contract: string };

export type FetchCustomTokenThunkState = AccountsRootState;

/** Reads a contract's token metadata and the account's balance of it, without adding it. */
export const fetchCustomTokenThunk = createThunk<
    TokenInfo,
    CustomTokenThunkPayload,
    { state: FetchCustomTokenThunkState; rejectValue: CustomTokenFetchError }
>(
    `${CUSTOM_TOKEN_MODULE_PREFIX}/fetchCustomTokenThunk`,
    async ({ accountKey, contract }, { getState, rejectWithValue }) => {
        const account = selectAccountByKey(getState(), accountKey);
        if (!account) return rejectWithValue('fetch-failed');

        let timeout: ReturnType<typeof setTimeout> | undefined;
        const response = await Promise.race([
            TrezorConnect.getAccountInfo({
                coin: asCoinSymbol(account.symbol),
                identity: tryGetAccountIdentity(account),
                descriptor: account.descriptor,
                details: 'tokenBalances',
                contractFilter: contract,
            }),
            new Promise<null>(resolve => {
                timeout = setTimeout(() => resolve(null), FETCH_TIMEOUT_MS);
            }),
        ]).finally(() => clearTimeout(timeout));

        if (!response?.success) return rejectWithValue('fetch-failed');

        const token = findToken(response.payload.tokens, contract);
        if (!token || !isSupportedCustomToken(token, account))
            return rejectWithValue('not-a-token');

        return token;
    },
);

export type AddCustomTokenThunkState = AccountsRootState;

export const addCustomTokenThunk = createThunk<
    void,
    { accountKey: AccountKey; token: TokenInfo },
    { state: AddCustomTokenThunkState }
>(
    `${CUSTOM_TOKEN_MODULE_PREFIX}/addCustomTokenThunk`,
    ({ accountKey, token }, { dispatch, getState }) => {
        const account = selectAccountByKey(getState(), accountKey);
        if (!account) return;

        dispatch(
            customTokensActions.addCustomToken({
                accountKey,
                symbol: account.symbol,
                contract: token.contract,
                addedAt: Date.now(),
            }),
        );

        if (!findToken(account.tokens, token.contract)) {
            dispatch(accountsActions.addAccountTokens(accountKey, enhanceTokens([token])));
        }

        // Absent from the coin definitions, it would otherwise be filed as unverified and hidden.
        dispatch(
            tokenDefinitionsActions.setTokenStatus({
                symbol: account.symbol,
                contractAddress: token.contract,
                status: TokenManagementAction.SHOW,
                type: DefinitionType.COIN,
            }),
        );
    },
);

export type RemoveCustomTokenThunkState = AccountsRootState;

/**
 * A token the backend still lists stays on the account, hidden; it cannot be removed from what
 * the account holds. Hidden also keeps a later airdrop of it from showing as trusted.
 */
export const removeCustomTokenThunk = createThunk<
    void,
    CustomTokenThunkPayload,
    { state: RemoveCustomTokenThunkState }
>(
    `${CUSTOM_TOKEN_MODULE_PREFIX}/removeCustomTokenThunk`,
    async ({ accountKey, contract }, { dispatch, getState }) => {
        const account = selectAccountByKey(getState(), accountKey);
        if (!account) return;

        dispatch(
            customTokensActions.removeCustomToken({ accountKey, symbol: account.symbol, contract }),
        );
        dispatch(
            tokenDefinitionsActions.setTokenStatus({
                symbol: account.symbol,
                contractAddress: contract,
                status: TokenManagementAction.HIDE,
                type: DefinitionType.COIN,
            }),
        );

        const response = await TrezorConnect.getAccountInfo({
            coin: asCoinSymbol(account.symbol),
            identity: tryGetAccountIdentity(account),
            descriptor: account.descriptor,
            details: 'tokenBalances',
        });
        if (!response.success || findToken(response.payload.tokens, contract)) return;

        const normalized = getContractAddressForNetworkSymbol(account.symbol, contract);
        const contracts =
            selectAccountByKey(getState(), accountKey)
                ?.tokens?.filter(
                    token =>
                        getContractAddressForNetworkSymbol(account.symbol, token.contract) ===
                        normalized,
                )
                .map(token => token.contract) ?? [];

        if (contracts.length) {
            dispatch(accountsActions.removeAccountTokens(accountKey, contracts));
        }
    },
);
