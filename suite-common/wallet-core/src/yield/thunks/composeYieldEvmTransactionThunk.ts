import { createThunk } from '@suite-common/redux-utils';
import { getNetwork } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { getAccountIdentity, getConvertedOrDefaultFeeInfo } from '@suite-common/wallet-utils';

import {
    type GetOrFetchRawFeeInfoThunkState,
    getOrFetchRawFeeInfoThunk,
} from '../../fees/feesThunks';
import {
    type EthereumGetCurrentNonceThunkState,
    ethereumGetCurrentNonceThunk,
} from '../../send/sendFormEthereumThunks';
import { estimateYieldFeeLevel } from '../utils/yieldFeeEstimation';
import { buildYieldUnsignedTransaction } from '../utils/yieldUtils';
import { YIELD_PREFIX } from '../yieldConstants';

export type ComposeYieldEvmTransactionErrorReason =
    'unsupported-network' | 'missing-chain-id' | 'missing-fee-level' | 'fee-estimation-failed';

export type ComposeYieldEvmTransactionResult =
    | {
          type: 'action-ready';
          unsignedTransaction: string;
      }
    | {
          type: 'error';
          reason: ComposeYieldEvmTransactionErrorReason;
      };

type ComposeYieldEvmTransactionPayload = {
    account: Account;
    to: string;
    data: string;
    value?: string;
    gasLimitFallback?: string;
};

export type ComposeYieldEvmTransactionThunkState = EthereumGetCurrentNonceThunkState &
    GetOrFetchRawFeeInfoThunkState;

export const composeYieldEvmTransactionThunk = createThunk<
    ComposeYieldEvmTransactionResult,
    ComposeYieldEvmTransactionPayload,
    {
        state: ComposeYieldEvmTransactionThunkState;
    }
>(
    `${YIELD_PREFIX}/thunk/composeEvmTransaction`,
    async ({ account, to, data, value, gasLimitFallback }, { dispatch }) => {
        if (account.networkType !== 'ethereum') {
            return { type: 'error', reason: 'unsupported-network' } as const;
        }

        const network = getNetwork(account.symbol);

        if (!network.chainId) {
            return { type: 'error', reason: 'missing-chain-id' } as const;
        }

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
                to,
                data,
                value,
            }),
        ]);

        const gasLimit = estimatedFeeLevel.success
            ? estimatedFeeLevel.payload.feeLimit
            : gasLimitFallback;

        if (!gasLimit) {
            return { type: 'error', reason: 'fee-estimation-failed' } as const;
        }

        const rawFeeInfo = await dispatch(
            getOrFetchRawFeeInfoThunk({ networkSymbol: account.symbol }),
        ).unwrap();

        const feeInfo = getConvertedOrDefaultFeeInfo({
            networkType: account.networkType,
            feeInfo: rawFeeInfo,
        });

        const feeLevel =
            feeInfo.levels.find(level => level.label === 'normal') ?? feeInfo.levels[0];

        if (!feeLevel) {
            return { type: 'error', reason: 'missing-fee-level' } as const;
        }

        const unsignedTransaction = JSON.stringify(
            buildYieldUnsignedTransaction({
                chainId: network.chainId,
                data,
                feeLevel,
                from: account.descriptor,
                gasLimit,
                nonce: Number(nonce),
                to,
                value,
            }),
        );

        return { type: 'action-ready', unsignedTransaction } as const;
    },
);
