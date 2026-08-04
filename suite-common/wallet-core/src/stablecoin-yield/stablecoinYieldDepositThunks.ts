import { asEvmAddress } from '@suite-common/calldata';
import { createThunk } from '@suite-common/redux-utils';
import { getNetwork } from '@suite-common/wallet-config';
import {
    asAmountUnit,
    getAccountIdentity,
    getConvertedOrDefaultFeeInfo,
    tokenSupportsIncreasingAllowance,
    unitsToSubunits,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { getApprovalRequestAmount } from './stablecoinYieldApprovalThunks';
import { STABLECOIN_YIELD_PREFIX } from './stablecoinYieldConstants';
import { estimateYieldFeeLevel } from './stablecoinYieldFeeEstimation';
import type { YieldFlowResolvedData } from './stablecoinYieldTypes';
import {
    buildYieldDepositCalldata,
    buildYieldUnsignedTransaction,
    getAllowanceSpender,
    getWithdrawRequestAmount,
} from './stablecoinYieldUtils';
import { type AccountsRootState } from '../accounts/accountsReducer';
import { fetchAllowance } from '../allowance/fetchAllowance';
import { type FeesRootState, selectRawNetworkFeeInfo } from '../fees/feesReducer';
import { ethereumGetCurrentNonceThunk } from '../send/sendFormEthereumThunks';
import { type TransactionsRootState } from '../transactions/transactionsReducerTypes';

const YIELD_DEPOSIT_THUNK_PREFIX = `${STABLECOIN_YIELD_PREFIX}/thunk`;

export type YieldDepositErrorReason =
    | 'unsupported-network'
    | 'missing-deposit-params'
    | 'vault-chain-mismatch'
    | 'missing-fee-level'
    | 'fee-estimation-failed'
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
type ComposeYieldDepositTransactionThunkState = AccountsRootState &
    FeesRootState &
    TransactionsRootState;

export const composeYieldDepositTransactionThunk = createThunk<
    PrepareYieldDepositResult,
    ComposeYieldDepositTransactionPayload,
    {
        state: ComposeYieldDepositTransactionThunkState;
    }
>(
    `${YIELD_DEPOSIT_THUNK_PREFIX}/composeDepositTransaction`,
    async ({ flowData, amount }, { dispatch, getState }) => {
        const { account, token, vault } = flowData;

        if (account.networkType !== 'ethereum') {
            return { type: 'error', reason: 'unsupported-network' } as const;
        }

        const requestAmount = getApprovalRequestAmount({
            flowType: 'deposit',
            amount,
            flowData,
        });
        const spender = getAllowanceSpender(flowData);
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
                to: spender,
                data: calldata,
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
                data: calldata,
                feeLevel: normalLevel,
                from: account.descriptor,
                gasLimit: estimatedFeeLevel.payload.feeLimit,
                nonce: Number(nonce),
                to: spender,
            }),
        );

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
            unsignedTransaction,
            receiptAmount,
        };
    },
);
