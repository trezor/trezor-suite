import { asEvmAddress } from '@suite-common/calldata';
import { selectNetworkConfigAccessors, type NetworksRootState } from '@suite-common/networks';
import { createThunk } from '@suite-common/redux-utils';
import { getNetwork } from '@suite-common/wallet-config';

import {
    type ComposeYieldEvmTransactionErrorReason,
    type ComposeYieldEvmTransactionThunkState,
    composeYieldEvmTransactionThunk,
} from './composeYieldEvmTransactionThunk';
import { buildYieldWithdrawCalldata, getYieldVaultAddress } from '../utils/yieldUtils';
import { YIELD_PREFIX } from '../yieldConstants';
import type { YieldFlowResolvedData, YieldWithdrawFlowType } from '../yieldTypes';

export type ComposeYieldWithdrawErrorReason =
    ComposeYieldEvmTransactionErrorReason | 'missing-vault-address' | 'vault-chain-mismatch';

export type ComposeYieldWithdrawResult =
    | {
          type: 'action-ready';
          unsignedTransaction: string;
      }
    | {
          type: 'error';
          reason: ComposeYieldWithdrawErrorReason;
      };

type ComposeYieldWithdrawTransactionPayload = {
    flowData: YieldFlowResolvedData;
    amount: string;
    flowType: YieldWithdrawFlowType;
};

export const isYieldWithdrawFeeError = (reason: ComposeYieldWithdrawErrorReason) =>
    reason === 'fee-estimation-failed' || reason === 'missing-fee-level';

export type ComposeYieldWithdrawTransactionThunkState = ComposeYieldEvmTransactionThunkState &
    NetworksRootState;

export const composeYieldWithdrawTransactionThunk = createThunk<
    ComposeYieldWithdrawResult,
    ComposeYieldWithdrawTransactionPayload,
    {
        state: ComposeYieldWithdrawTransactionThunkState;
    }
>(
    `${YIELD_PREFIX}/thunk/composeWithdrawTransaction`,
    async ({ flowData, amount, flowType }, { getState, dispatch }) => {
        const networkConfigDeps = selectNetworkConfigAccessors(getState());

        const { account, vault } = flowData;

        if (account.networkType !== 'ethereum') {
            return { type: 'error', reason: 'unsupported-network' } as const;
        }

        const vaultAddress = getYieldVaultAddress(flowData);

        if (!vaultAddress) {
            return { type: 'error', reason: 'missing-vault-address' } as const;
        }

        const network = getNetwork(networkConfigDeps, account.symbol);

        if (!network.chainId) {
            return { type: 'error', reason: 'missing-chain-id' } as const;
        }

        if (vault.chainId !== network.chainId) {
            return { type: 'error', reason: 'vault-chain-mismatch' } as const;
        }

        const ownerAddress = asEvmAddress(account.descriptor);

        const calldata = buildYieldWithdrawCalldata(networkConfigDeps, {
            amount,
            flowData,
            ownerAddress,
            receiverAddress: ownerAddress,
            flowType,
        });

        return await dispatch(
            composeYieldEvmTransactionThunk({ account, to: vaultAddress, data: calldata }),
        ).unwrap();
    },
);
