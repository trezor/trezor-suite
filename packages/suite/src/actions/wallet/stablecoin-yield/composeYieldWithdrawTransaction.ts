import { type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';

import { asEvmAddress } from '@suite-common/calldata';
import { getYieldVault } from '@suite-common/earn-stablecoin-api';
import { getNetwork } from '@suite-common/wallet-config';
import {
    type EthereumGetCurrentNonceThunkState,
    type GetOrFetchRawFeeInfoThunkState,
    type YieldFeeEstimationError,
    type YieldFlowResolvedData,
    type YieldWithdrawFlowType,
    buildYieldUnsignedTransaction,
    buildYieldWithdrawCalldata,
    estimateYieldFeeLevel,
    getOrFetchRawFeeInfoThunk,
} from '@suite-common/wallet-core';
import { ethereumGetCurrentNonceThunk } from '@suite-common/wallet-core/src/send/sendFormEthereumThunks';
import { type Account } from '@suite-common/wallet-types';
import { getAccountIdentity, getConvertedOrDefaultFeeInfo } from '@suite-common/wallet-utils';
import { type Result, err, ok } from '@trezor/type-utils';

export type ComposeYieldWithdrawTransactionState = EthereumGetCurrentNonceThunkState &
    GetOrFetchRawFeeInfoThunkState;
type ComposeYieldWithdrawTransactionDispatch = ThunkDispatch<
    ComposeYieldWithdrawTransactionState,
    Record<never, never>,
    UnknownAction
>;

export type ComposeYieldWithdrawTransactionParams = {
    account: Account & { networkType: 'ethereum' };
    flowData: YieldFlowResolvedData;
    amount: string;
    flowType: YieldWithdrawFlowType;
    dispatch: ComposeYieldWithdrawTransactionDispatch;
};

export const composeYieldWithdrawTransaction = async ({
    account,
    flowData,
    amount,
    flowType,
    dispatch,
}: ComposeYieldWithdrawTransactionParams): Promise<Result<string, YieldFeeEstimationError>> => {
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

    const estimatedFeeTask = estimateYieldFeeLevel({
        coin: account.symbol,
        identity: getAccountIdentity(account),
        from: account.descriptor,
        to: vaultAddress,
        data: calldata,
    });

    const [{ nonce }, estimatedFeeLevel] = await Promise.all([nonceTask, estimatedFeeTask]);

    if (!estimatedFeeLevel.success) {
        return err(estimatedFeeLevel.error);
    }

    const gasLimit = estimatedFeeLevel.payload.feeLimit;

    const rawFeeInfo = await dispatch(
        getOrFetchRawFeeInfoThunk({ networkSymbol: account.symbol }),
    ).unwrap();

    const feeInfo = getConvertedOrDefaultFeeInfo({
        networkType: account.networkType,
        feeInfo: rawFeeInfo,
    });
    const normalLevel = feeInfo.levels.find(level => level.label === 'normal') ?? feeInfo.levels[0];

    if (!normalLevel) {
        return err('fee-estimation-failed');
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

    return ok(JSON.stringify(unsignedTx));
};
