import { asEvmAddress } from '@suite-common/calldata';
import { getYieldVault } from '@suite-common/earn-stablecoin-api';
import { ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT } from '@suite-common/wallet-constants';
import {
    type YieldFlowResolvedData,
    type YieldWithdrawFlowType,
    buildYieldWithdrawCalldata,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

import type { AppState, Dispatch } from 'src/types/suite';

import { composeYieldEvmTransaction } from './composeYieldEvmTransaction';

export type ComposeYieldWithdrawTransactionParams = {
    account: Account & { networkType: 'ethereum' };
    flowData: YieldFlowResolvedData;
    amount: string;
    flowType: YieldWithdrawFlowType;
    dispatch: Dispatch;
    getState: () => AppState;
};

export const composeYieldWithdrawTransaction = async ({
    account,
    flowData,
    amount,
    flowType,
    dispatch,
    getState,
}: ComposeYieldWithdrawTransactionParams): Promise<string> => {
    const { vault } = flowData;

    const { address: vaultAddress } = await getYieldVault({
        routeParams: {
            networkSymbol: account.symbol,
            vaultId: vault.id,
        },
    });

    const ownerAddress = asEvmAddress(account.descriptor);
    const calldata = buildYieldWithdrawCalldata({
        amount,
        flowData,
        ownerAddress,
        receiverAddress: ownerAddress,
        flowType,
    });

    return composeYieldEvmTransaction({
        account,
        to: vaultAddress,
        data: calldata,
        backupGasLimit: ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT,
        vaultChainId: vault.chainId,
        dispatch,
        getState,
    });
};
