import { notificationsActions } from '@suite-common/toast-notifications';
import { getNetwork } from '@suite-common/wallet-config';
import { buildYieldUnsignedTransaction, selectRawNetworkFeeInfo } from '@suite-common/wallet-core';
import { ethereumGetCurrentNonceThunk } from '@suite-common/wallet-core/src/send/sendFormEthereumThunks';
import { type Account } from '@suite-common/wallet-types';
import { getAccountIdentity, getConvertedOrDefaultFeeInfo } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';

import type { AppState, Dispatch } from 'src/types/suite';

export type ComposeYieldEvmTransactionParams = {
    account: Account & { networkType: 'ethereum' };
    to: string;
    data: string;
    value?: string;
    backupGasLimit: string;
    /** When given (even null), it must equal the account network's chainId. */
    vaultChainId?: number | null;
    dispatch: Dispatch;
    getState: () => AppState;
};

/**
 * Composes an unsigned EVM transaction of a yield flow: resolves the confirmed
 * nonce, estimates the gas limit (falling back to the flow's backup), applies
 * the normal fee level and serializes the result for signing.
 */
export const composeYieldEvmTransaction = async ({
    account,
    to,
    data,
    value,
    backupGasLimit,
    vaultChainId,
    dispatch,
    getState,
}: ComposeYieldEvmTransactionParams): Promise<string> => {
    const network = getNetwork(account.symbol);

    if (!network.chainId) {
        throw new Error(`Network ${account.symbol} is missing chainId.`);
    }

    if (vaultChainId !== undefined && vaultChainId !== network.chainId) {
        throw new Error(
            `Account network chainId ${network.chainId} does not match vault chainId ${vaultChainId}.`,
        );
    }

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
                to,
                data,
                value: value ?? '0x0',
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

    const gasLimit = estimatedGasLimit ?? backupGasLimit;

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
        data,
        feeLevel: normalLevel,
        from: account.descriptor,
        gasLimit,
        nonce: Number(nonce),
        to,
        value,
    });

    // Both the value and the whole fee are debited from the native balance — reject
    // a transaction that cannot be paid for instead of letting broadcasting fail.
    const feePerGas = 'maxFeePerGas' in unsignedTx ? unsignedTx.maxFeePerGas : unsignedTx.gasPrice;
    const maxDebit = BigInt(unsignedTx.value) + BigInt(unsignedTx.gasLimit) * BigInt(feePerGas);

    if (maxDebit > BigInt(account.availableBalance)) {
        throw new Error('Insufficient native balance to cover the transaction value and fee.');
    }

    return JSON.stringify(unsignedTx);
};
