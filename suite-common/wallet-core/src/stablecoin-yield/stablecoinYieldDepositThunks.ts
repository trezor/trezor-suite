import { asEvmAddress } from '@suite-common/calldata';
import { createThunk } from '@suite-common/redux-utils';
import { getNetwork } from '@suite-common/wallet-config';
import { ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT } from '@suite-common/wallet-constants';
import {
    asAmountUnit,
    getAccountIdentity,
    getConvertedOrDefaultFeeInfo,
    tokenSupportsIncreasingAllowance,
    unitsToSubunits,
} from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import { getApprovalRequestAmount, setYieldGenericError } from './stablecoinYieldApprovalThunks';
import { STABLECOIN_YIELD_PREFIX, stablecoinYieldActions } from './stablecoinYieldReducer';
import type { YieldFlowResolvedData } from './stablecoinYieldTypes';
import {
    buildYieldDepositCalldata,
    buildYieldUnsignedTransaction,
    getAllowanceSpender,
    getWithdrawRequestAmount,
} from './stablecoinYieldUtils';
import { fetchAllowance } from '../allowance/fetchAllowance';
import { selectRawNetworkFeeInfo } from '../fees/feesReducer';
import { ethereumGetCurrentNonceThunk } from '../send/sendFormEthereumThunks';

const YIELD_DEPOSIT_THUNK_PREFIX = `${STABLECOIN_YIELD_PREFIX}/thunk`;

export type YieldDepositErrorReason =
    | 'unsupported-network'
    | 'missing-deposit-params'
    | 'vault-chain-mismatch'
    | 'missing-fee-level'
    | 'compose-failed';

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

type PrepareYieldDepositPayload = {
    flowKey: string;
    flowData: YieldFlowResolvedData;
    amount: string;
};

export const composeYieldDepositTransactionThunk = createThunk<
    PrepareYieldDepositResult,
    ComposeYieldDepositTransactionPayload,
    void
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

        const [{ nonce }, estimatedFee] = await Promise.all([
            dispatch(ethereumGetCurrentNonceThunk({ selectedAccount: account })).unwrap(),
            TrezorConnect.blockchainEstimateFee({
                coin: account.symbol,
                identity: getAccountIdentity(account),
                request: {
                    blocks: [2],
                    specific: {
                        from: account.descriptor,
                        to: spender,
                        data: calldata,
                        value: '0x0',
                    },
                },
            }),
        ]);
        const estimatedGasLimit = estimatedFee.success
            ? estimatedFee.payload.levels[0]?.feeLimit
            : undefined;

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
                gasLimit: estimatedGasLimit ?? ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT,
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

export const prepareYieldDepositThunk = createThunk<
    PrepareYieldDepositResult,
    PrepareYieldDepositPayload,
    void
>(
    `${YIELD_DEPOSIT_THUNK_PREFIX}/prepareDeposit`,
    async ({ flowKey, flowData, amount }, { dispatch }) => {
        const flowType = 'deposit' as const;

        dispatch(stablecoinYieldActions.startSubmittingAction({ flowType, flowKey, amount }));

        try {
            const result = await dispatch(
                composeYieldDepositTransactionThunk({ flowData, amount }),
            ).unwrap();

            if (result.type === 'error') {
                setYieldGenericError({ dispatch, flowType, flowKey });
            }

            return result;
        } catch {
            setYieldGenericError({ dispatch, flowType, flowKey });

            return { type: 'error', reason: 'compose-failed' } as const;
        } finally {
            dispatch(stablecoinYieldActions.finishSubmittingAction({ flowType, flowKey }));
        }
    },
);
