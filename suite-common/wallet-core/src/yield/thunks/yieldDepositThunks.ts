import { asEvmAddress } from '@suite-common/calldata';
import { createThunk } from '@suite-common/redux-utils';
import { getNetwork } from '@suite-common/wallet-config';
import {
    asAmountUnit,
    tokenSupportsIncreasingAllowance,
    unitsToSubunits,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import {
    type ComposeYieldEvmTransactionErrorReason,
    type ComposeYieldEvmTransactionThunkState,
    composeYieldEvmTransactionThunk,
} from './composeYieldEvmTransactionThunk';
import { getApprovalRequestAmount } from './yieldApprovalThunks';
import { fetchAllowance } from '../../allowance/fetchAllowance';
import {
    buildYieldDepositCalldata,
    getWithdrawRequestAmount,
    getYieldVaultAddress,
} from '../utils/yieldUtils';
import { YIELD_PREFIX } from '../yieldConstants';
import type { YieldFlowResolvedData } from '../yieldTypes';

const YIELD_DEPOSIT_THUNK_PREFIX = `${YIELD_PREFIX}/thunk`;

export type YieldDepositErrorReason =
    | ComposeYieldEvmTransactionErrorReason
    | 'missing-deposit-params'
    | 'vault-chain-mismatch'
    | 'compose-failed';

export const getYieldDepositErrorTranslationKey = (reason: YieldDepositErrorReason) =>
    reason === 'fee-estimation-failed'
        ? ('TR_EARN_YIELD_ERROR_FEE_ESTIMATION' as const)
        : ('TR_EARN_YIELD_ERROR_GENERIC' as const);

export type PrepareYieldDepositResult =
    | {
          type: 'action-ready';
          unsignedTransaction: string;
          receiptAmount: string;
      }
    | {
          type: 'approval-required';
          spender: string;
      }
    | {
          type: 'revoke-required';
          spender: string | null;
      }
    | {
          type: 'error';
          reason: YieldDepositErrorReason;
      };

type ComposeYieldDepositTransactionPayload = {
    flowData: YieldFlowResolvedData;
    amount: string;
};

export type ComposeYieldDepositTransactionThunkState = ComposeYieldEvmTransactionThunkState;

export const composeYieldDepositTransactionThunk = createThunk<
    PrepareYieldDepositResult,
    ComposeYieldDepositTransactionPayload,
    {
        state: ComposeYieldDepositTransactionThunkState;
    }
>(
    `${YIELD_DEPOSIT_THUNK_PREFIX}/composeDepositTransaction`,
    async ({ flowData, amount }, { dispatch }) => {
        const { account, token, vault } = flowData;

        if (account.networkType !== 'ethereum') {
            return { type: 'error', reason: 'unsupported-network' } as const;
        }

        const requestAmount = getApprovalRequestAmount({
            flowType: 'deposit',
            amount,
            flowData,
        });
        const spender = getYieldVaultAddress(flowData);
        const tokenContractAddress = token.contractAddress;

        if (!requestAmount || !spender || !tokenContractAddress) {
            return { type: 'error', reason: 'missing-deposit-params' } as const;
        }

        const allowanceSubunits = await fetchAllowance({
            owner: account.descriptor,
            spender,
            tokenContractAddress,
            coin: account.symbol,
        });
        const requestSubunits = unitsToSubunits({
            value: asAmountUnit(new BigNumber(requestAmount)),
            decimals: token.decimals,
        });

        if (allowanceSubunits.lt(requestSubunits)) {
            const isRevokeRequired =
                allowanceSubunits.gt(0) && !tokenSupportsIncreasingAllowance(tokenContractAddress);

            return isRevokeRequired
                ? { type: 'revoke-required', spender }
                : { type: 'approval-required', spender };
        }

        const network = getNetwork(account.symbol);

        if (!network.chainId || vault.chainId !== network.chainId) {
            return { type: 'error', reason: 'vault-chain-mismatch' } as const;
        }

        const ownerAddress = asEvmAddress(account.descriptor);
        const calldata = buildYieldDepositCalldata({
            amount: requestAmount,
            flowData,
            ownerAddress,
            receiverAddress: ownerAddress,
        });

        const composeResult = await dispatch(
            composeYieldEvmTransactionThunk({
                account,
                to: spender,
                data: calldata,
            }),
        ).unwrap();

        if (composeResult.type === 'error') {
            return composeResult;
        }

        const receiptAmount =
            getWithdrawRequestAmount({
                networkSymbol: account.symbol,
                amount,
                token: flowData.token,
                receiptToken: flowData.receiptToken,
                pricePerShare: flowData.vault.state?.pricePerShareState?.price,
            }) ?? amount;

        return {
            type: 'action-ready',
            unsignedTransaction: composeResult.unsignedTransaction,
            receiptAmount,
        };
    },
);
