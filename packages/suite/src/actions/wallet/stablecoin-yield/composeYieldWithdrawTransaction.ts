import { asEvmAddress } from '@suite-common/calldata';
import { getYieldVault } from '@suite-common/earn-stablecoin-api';
import { notificationsActions } from '@suite-common/toast-notifications';
import { getNetwork } from '@suite-common/wallet-config';
import { ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT } from '@suite-common/wallet-constants';
import {
    type YieldFlowResolvedData,
    type YieldWithdrawFlowType,
    buildYieldUnsignedTransaction,
    buildYieldWithdrawCalldata,
    selectRawNetworkFeeInfo,
} from '@suite-common/wallet-core';
import { ethereumGetCurrentNonceThunk } from '@suite-common/wallet-core/src/send/sendFormEthereumThunks';
import { type Account } from '@suite-common/wallet-types';
import { getAccountIdentity, getConvertedOrDefaultFeeInfo } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';

import type { AppState, Dispatch } from 'src/types/suite';

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
    const network = getNetwork(account.symbol);

    if (!network.chainId) {
        throw new Error(`Network ${account.symbol} is missing chainId.`);
    }

    if (vault.chainId !== network.chainId) {
        throw new Error(
            `Account network chainId ${network.chainId} does not match vault chainId ${vault.chainId}.`,
        );
    }

    const ownerAddress = asEvmAddress(account.descriptor);
    const calldata = buildYieldWithdrawCalldata({
        amount,
        flowData,
        ownerAddress,
        receiverAddress: ownerAddress,
        flowType,
    });

    const nonceTask = dispatch(
        ethereumGetCurrentNonceThunk({ selectedAccount: account, fetchConfirmedNonce: true }),
    ).unwrap();

    const estimatedFeeTask = TrezorConnect.blockchainEstimateFee({
        coin: account.symbol,
        identity: getAccountIdentity(account),
        request: {
            blocks: [2],
            specific: {
                from: account.descriptor,
                to: vaultAddress,
                data: calldata,
                value: '0x0',
            },
        },
    });

    const [{ nonce }, estimatedFee] = await Promise.all([nonceTask, estimatedFeeTask]);

    const estimatedGasLimit = estimatedFee.success
        ? estimatedFee.payload.levels[0]?.feeLimit
        : undefined;

    if (!estimatedGasLimit) {
        dispatch(notificationsActions.addToast({ type: 'estimated-fee-error' }));
    }

    const gasLimit = estimatedGasLimit ?? ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT;

    const feeInfo = getConvertedOrDefaultFeeInfo({
        networkType: account.networkType,
        feeInfo: selectRawNetworkFeeInfo(getState(), account.symbol),
    });
    const normalLevel = feeInfo.levels.find(level => level.label === 'normal') ?? feeInfo.levels[0];

    if (!normalLevel) {
        throw new Error(`Fee info is not available.`);
    }

    const unsignedTx = buildYieldUnsignedTransaction({
        chainId: network.chainId,
        data: calldata,
        feeLevel: normalLevel,
        from: account.descriptor,
        gasLimit,
        nonce: Number(nonce),
        to: vaultAddress,
    });

    return JSON.stringify(unsignedTx);
};
