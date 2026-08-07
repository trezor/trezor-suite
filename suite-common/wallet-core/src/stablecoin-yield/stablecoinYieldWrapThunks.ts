import { createThunk } from '@suite-common/redux-utils';
import { getNetwork } from '@suite-common/wallet-config';
import { WETH_DEPOSIT_BACKUP_GAS_LIMIT } from '@suite-common/wallet-constants';
import { type Account } from '@suite-common/wallet-types';
import {
    getAccountIdentity,
    getConvertedOrDefaultFeeInfo,
    isWrappedNativeToken,
} from '@suite-common/wallet-utils';

import { STABLECOIN_YIELD_PREFIX } from './stablecoinYieldConstants';
import { estimateYieldFeeLevel } from './stablecoinYieldFeeEstimation';
import type { YieldFlowDisplayToken } from './stablecoinYieldTypes';
import {
    buildYieldUnsignedTransaction,
    buildYieldUnwrapTransactionData,
    buildYieldWrapTransactionData,
} from './stablecoinYieldUtils';
import { type AccountsRootState } from '../accounts/accountsReducer';
import { type FeesRootState, selectRawNetworkFeeInfo } from '../fees/feesReducer';
import { ethereumGetCurrentNonceThunk } from '../send/sendFormEthereumThunks';
import { type TransactionsRootState } from '../transactions/transactionsReducerTypes';

const YIELD_WRAP_THUNK_PREFIX = `${STABLECOIN_YIELD_PREFIX}/thunk`;

export type ComposeYieldWrapErrorReason =
    | 'unsupported-network'
    | 'not-wrapped-native'
    | 'missing-chain-id'
    | 'missing-fee-level'
    | 'fee-estimation-failed';

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
export type ComposeYieldWrapTransactionThunkState = AccountsRootState &
    FeesRootState &
    TransactionsRootState;

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
    async ({ account, token, wrapAmount }, { dispatch, getState }) => {
        if (account.networkType !== 'ethereum') {
            return { type: 'error', reason: 'unsupported-network' } as const;
        }

        const wethAddress = token.contractAddress;

        if (!isWrappedNativeToken(account.symbol, wethAddress) || !wethAddress) {
            return { type: 'error', reason: 'not-wrapped-native' } as const;
        }

        const network = getNetwork(account.symbol);

        if (!network.chainId) {
            return { type: 'error', reason: 'missing-chain-id' } as const;
        }

        const { data, value } = buildYieldWrapTransactionData({
            wrapAmount,
            decimals: token.decimals,
        });

        const [{ nonce }, estimatedFeeLevel] = await Promise.all([
            dispatch(
                ethereumGetCurrentNonceThunk({
                    selectedAccount: account,
                    fetchConfirmedNonce: true,
                }),
            ).unwrap(),
            estimateYieldFeeLevel({
                coin: account.symbol,
                identity: getAccountIdentity(account),
                from: account.descriptor,
                to: wethAddress,
                data,
                value,
            }),
        ]);

        // WETH deposit() is a fixed ~45k-gas call, so fall back to a known backup limit when
        // estimation fails rather than blocking the wrap.
        const gasLimit = estimatedFeeLevel.success
            ? estimatedFeeLevel.payload.feeLimit
            : WETH_DEPOSIT_BACKUP_GAS_LIMIT;

        const feeInfo = getConvertedOrDefaultFeeInfo({
            networkType: account.networkType,
            feeInfo: selectRawNetworkFeeInfo(getState(), account.symbol),
        });
        const normalLevel =
            feeInfo.levels.find(level => level.label === 'normal') ?? feeInfo.levels[0];

        if (!normalLevel) {
            return { type: 'error', reason: 'missing-fee-level' } as const;
        }

        const unsignedTransaction = JSON.stringify(
            buildYieldUnsignedTransaction({
                chainId: network.chainId,
                data,
                feeLevel: normalLevel,
                from: account.descriptor,
                gasLimit,
                nonce: Number(nonce),
                to: wethAddress,
                value,
            }),
        );

        return { type: 'action-ready', unsignedTransaction } as const;
    },
);

export type ComposeYieldUnwrapTransactionThunkState = AccountsRootState &
    FeesRootState &
    TransactionsRootState;

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
    async ({ account, token, unwrapAmount }, { dispatch, getState }) => {
        if (account.networkType !== 'ethereum') {
            return { type: 'error', reason: 'unsupported-network' } as const;
        }

        const wethAddress = token.contractAddress;

        if (!isWrappedNativeToken(account.symbol, wethAddress) || !wethAddress) {
            return { type: 'error', reason: 'not-wrapped-native' } as const;
        }

        const network = getNetwork(account.symbol);

        if (!network.chainId) {
            return { type: 'error', reason: 'missing-chain-id' } as const;
        }

        const { data } = buildYieldUnwrapTransactionData({
            unwrapAmount,
            decimals: token.decimals,
        });

        const [{ nonce }, estimatedFeeLevel] = await Promise.all([
            dispatch(
                ethereumGetCurrentNonceThunk({
                    selectedAccount: account,
                    fetchConfirmedNonce: true,
                }),
            ).unwrap(),
            estimateYieldFeeLevel({
                coin: account.symbol,
                identity: getAccountIdentity(account),
                from: account.descriptor,
                to: wethAddress,
                data,
            }),
        ]);

        if (!estimatedFeeLevel.success) {
            return { type: 'error', reason: 'fee-estimation-failed' } as const;
        }

        const feeInfo = getConvertedOrDefaultFeeInfo({
            networkType: account.networkType,
            feeInfo: selectRawNetworkFeeInfo(getState(), account.symbol),
        });
        const normalLevel =
            feeInfo.levels.find(level => level.label === 'normal') ?? feeInfo.levels[0];

        if (!normalLevel) {
            return { type: 'error', reason: 'missing-fee-level' } as const;
        }

        const unsignedTransaction = JSON.stringify(
            buildYieldUnsignedTransaction({
                chainId: network.chainId,
                data,
                feeLevel: normalLevel,
                from: account.descriptor,
                gasLimit: estimatedFeeLevel.payload.feeLimit,
                nonce: Number(nonce),
                to: wethAddress,
            }),
        );

        return { type: 'action-ready', unsignedTransaction } as const;
    },
);
