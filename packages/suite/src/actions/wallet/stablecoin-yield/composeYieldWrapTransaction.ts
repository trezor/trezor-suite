import { WRAPPED_NATIVE_TOKEN_DECIMALS, isWrappedNativeToken } from '@suite-common/wallet-config';
import { WETH_DEPOSIT_BACKUP_GAS_LIMIT } from '@suite-common/wallet-constants';
import {
    type YieldFlowResolvedData,
    buildYieldWrapTransactionData,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

import type { AppState, Dispatch } from 'src/types/suite';

import { composeYieldEvmTransaction } from './composeYieldEvmTransaction';

export type ComposeYieldWrapTransactionParams = {
    account: Account & { networkType: 'ethereum' };
    flowData: YieldFlowResolvedData;
    wrapAmount: string;
    dispatch: Dispatch;
    getState: () => AppState;
};

export const composeYieldWrapTransaction = ({
    account,
    flowData,
    wrapAmount,
    dispatch,
    getState,
}: ComposeYieldWrapTransactionParams): Promise<string> => {
    const { vault, token } = flowData;
    const wethAddress = token.contractAddress;

    // Never compose a value-carrying transaction to anything but the canonical
    // wrapped-native contract of the account network.
    if (!isWrappedNativeToken(account.symbol, wethAddress) || !wethAddress) {
        throw new Error('Vault token is not the wrapped native token of the account network.');
    }

    const { data, value } = buildYieldWrapTransactionData({
        wrapAmount,
        decimals: WRAPPED_NATIVE_TOKEN_DECIMALS,
    });

    return composeYieldEvmTransaction({
        account,
        to: wethAddress,
        data,
        value,
        backupGasLimit: WETH_DEPOSIT_BACKUP_GAS_LIMIT,
        vaultChainId: vault.chainId,
        dispatch,
        getState,
    });
};
