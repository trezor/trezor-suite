import { createThunk } from '@suite-common/redux-utils';
import { WETH_DEPOSIT_BACKUP_GAS_LIMIT } from '@suite-common/wallet-constants';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import { enhanceTokens } from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/connect';
import {
    getWrappedNativeAddress,
    getWrappedNativeToken,
    isWrappedNativeToken,
} from '@trezor/network-ethereum-suite-common';
import { BigNumber } from '@trezor/utils';

import {
    type ComposeYieldEvmTransactionErrorReason,
    type ComposeYieldEvmTransactionThunkState,
    composeYieldEvmTransactionThunk,
} from './composeYieldEvmTransactionThunk';
import { accountsActions } from '../../accounts/accountsActions';
import { type AccountsRootState } from '../../accounts/accountsReducer';
import { selectAccountByKey } from '../../accounts/accountsSelectors';
import { STABLECOIN_YIELD_PREFIX } from '../stablecoinYieldConstants';
import type { YieldFlowDisplayToken } from '../stablecoinYieldTypes';
import { fetchWrappedNativeTokenInfo } from '../utils/fetchWrappedNativeTokenInfo';
import {
    buildYieldUnwrapTransactionData,
    buildYieldWrapTransactionData,
} from '../utils/stablecoinYieldUtils';

const YIELD_WRAP_THUNK_PREFIX = `${STABLECOIN_YIELD_PREFIX}/thunk`;

export type ComposeYieldWrapErrorReason =
    ComposeYieldEvmTransactionErrorReason | 'not-wrapped-native';

export type ComposeYieldWrapResult =
    | {
          type: 'action-ready';
          unsignedTransaction: string;
      }
    | {
          type: 'error';
          reason: ComposeYieldWrapErrorReason;
      };

type ComposeYieldWrapTransactionPayload = {
    account: Account;
    token: Pick<YieldFlowDisplayToken, 'contractAddress' | 'decimals'>;
    wrapAmount: string;
};

type ComposeYieldUnwrapTransactionPayload = {
    account: Account;
    token: Pick<YieldFlowDisplayToken, 'contractAddress' | 'decimals'>;
    unwrapAmount: string;
};
export type ComposeYieldWrapTransactionThunkState = ComposeYieldEvmTransactionThunkState;

/**
 * Composes an unsigned WETH `deposit()` (wrap) transaction that carries `wrapAmount` in its value.
 * Refuses to build a value-carrying transaction to anything but the account network's canonical
 * wrapped-native contract.
 */
export const composeYieldWrapTransactionThunk = createThunk<
    ComposeYieldWrapResult,
    ComposeYieldWrapTransactionPayload,
    {
        state: ComposeYieldWrapTransactionThunkState;
    }
>(
    `${YIELD_WRAP_THUNK_PREFIX}/composeWrapTransaction`,
    async ({ account, token, wrapAmount }, { dispatch }) => {
        if (account.networkType !== 'ethereum') {
            return { type: 'error', reason: 'unsupported-network' } as const;
        }

        const wethAddress = token.contractAddress;

        if (!isWrappedNativeToken(account.symbol, wethAddress) || !wethAddress) {
            return { type: 'error', reason: 'not-wrapped-native' } as const;
        }

        const { data, value } = buildYieldWrapTransactionData({
            wrapAmount,
            decimals: token.decimals,
        });

        return await dispatch(
            composeYieldEvmTransactionThunk({
                account,
                to: wethAddress,
                data,
                value,
                // WETH deposit() is a fixed ~45k-gas call, so a failed estimation falls back to a
                // known backup limit rather than blocking the wrap. Unwrapping has no such
                // fallback: withdraw(uint256) can revert on an insufficient balance, and a wrong
                // guess would spend the gas discovering that.
                gasLimitFallback: WETH_DEPOSIT_BACKUP_GAS_LIMIT,
            }),
        ).unwrap();
    },
);

export type TrackWrappedNativeTokenThunkState = AccountsRootState;

type TrackWrappedNativeTokenPayload = {
    accountKey: AccountKey;
    /**
     * 'fetch-balance' (default) fetches the current on-chain balance and tracks the token only
     * when it is positive. 'ensure-tracked' adds a zero-balance placeholder without fetching —
     * for a just-broadcast wrap, whose balance lands only once the transaction confirms, so the
     * token must already be tracked for account refreshes to pick it up.
     */
    mode?: 'fetch-balance' | 'ensure-tracked';
};

/**
 * Makes sure the account tracks the wrapped-native token (e.g. WETH) of its network. Wrapping
 * calls WETH `deposit()`, which emits no ERC-20 `Transfer` event, so the backend never discovers
 * the token on its own and the account may hold a balance without knowing about it.
 *
 * Returns the balance in display units: `null` means it could not be determined (the caller may
 * fall back to its own value), `'0'` means it is really zero — fetched, or the zero-balance
 * placeholder just added in 'ensure-tracked' mode.
 */
export const trackWrappedNativeTokenThunk = createThunk<
    string | null,
    TrackWrappedNativeTokenPayload,
    { state: TrackWrappedNativeTokenThunkState }
>(
    `${YIELD_WRAP_THUNK_PREFIX}/trackWrappedNativeToken`,
    async ({ accountKey, mode = 'fetch-balance' }, { dispatch, getState }) => {
        const account = selectAccountByKey(getState(), accountKey);

        if (account?.networkType !== 'ethereum') {
            return null;
        }

        const wrappedNativeContract = getWrappedNativeAddress(account.symbol);

        if (!wrappedNativeContract) {
            return null;
        }

        const isWrappedNativeContract = (contract: string) =>
            contract.toLowerCase() === wrappedNativeContract.toLowerCase();

        const trackedToken = account.tokens?.find(token => isWrappedNativeContract(token.contract));

        if (trackedToken) {
            return trackedToken.balance ?? '0';
        }

        if (mode === 'ensure-tracked') {
            const wrappedNative = getWrappedNativeToken(account.symbol);

            if (!wrappedNative) {
                return null;
            }

            const [placeholderToken] = enhanceTokens([
                {
                    standard: 'ERC20',
                    contract: wrappedNative.address,
                    symbol: wrappedNative.symbol,
                    name: wrappedNative.symbol,
                    decimals: wrappedNative.decimals,
                    balance: '0',
                },
            ]);

            if (placeholderToken) {
                dispatch(accountsActions.addAccountTokens(accountKey, [placeholderToken]));
            }

            return '0';
        }

        let tokenInfo: TokenInfo | null;
        try {
            tokenInfo = await fetchWrappedNativeTokenInfo({ account });
        } catch {
            return null;
        }

        if (!tokenInfo) {
            return null;
        }

        const [wrappedNativeToken] = enhanceTokens([tokenInfo]);
        const balance = wrappedNativeToken?.balance ?? '0';

        // A zero balance is not tracked, so it does not clutter the account's token list.
        if (!wrappedNativeToken || !new BigNumber(balance).gt(0)) {
            return '0';
        }

        const currentAccount = selectAccountByKey(getState(), accountKey);

        if (
            !currentAccount ||
            currentAccount.tokens?.some(token => isWrappedNativeContract(token.contract))
        ) {
            return balance;
        }

        dispatch(accountsActions.addAccountTokens(accountKey, [wrappedNativeToken]));

        return balance;
    },
);

export type ComposeYieldUnwrapTransactionThunkState = ComposeYieldEvmTransactionThunkState;

/**
 * Composes an unsigned WETH `withdraw(uint256)` (unwrap) transaction — the standalone WETH→ETH
 * action for the wrapped-native token.
 */
export const composeYieldUnwrapTransactionThunk = createThunk<
    ComposeYieldWrapResult,
    ComposeYieldUnwrapTransactionPayload,
    {
        state: ComposeYieldUnwrapTransactionThunkState;
    }
>(
    `${YIELD_WRAP_THUNK_PREFIX}/composeUnwrapTransaction`,
    async ({ account, token, unwrapAmount }, { dispatch }) => {
        if (account.networkType !== 'ethereum') {
            return { type: 'error', reason: 'unsupported-network' } as const;
        }

        const wethAddress = token.contractAddress;

        if (!isWrappedNativeToken(account.symbol, wethAddress) || !wethAddress) {
            return { type: 'error', reason: 'not-wrapped-native' } as const;
        }

        const { data } = buildYieldUnwrapTransactionData({
            unwrapAmount,
            decimals: token.decimals,
        });

        return await dispatch(
            composeYieldEvmTransactionThunk({
                account,
                to: wethAddress,
                data,
            }),
        ).unwrap();
    },
);
