import { type Result, err, ok } from '@trezor/type-utils';

import { getErrorMessage } from './getErrorMessage';
import { getLightningInvoice } from './getLightningInvoice';
import { type SparkWalletClientParams, getSdkWallet } from './getSdkWallet';
import { type SparkWalletClientError } from './getSparkWalletMnemonic';
import { mapSparkTransfer } from './mapSparkTransfer';
import { type SparkTransfer } from '../feature/sparkFeatureReducer';

const DEFAULT_TRANSFERS_PAGE_SIZE = 50;

type SparkWalletSnapshot = {
    balanceSats: string;
    bitcoinDepositAddress: string;
    lightningInvoice: string;
    mnemonic: string;
    transfers: SparkTransfer[];
};

export const loadSparkWalletSnapshot = async (
    params: SparkWalletClientParams,
): Promise<Result<SparkWalletSnapshot, SparkWalletClientError>> => {
    const walletResult = await getSdkWallet(params);

    if (!walletResult.success) {
        return walletResult;
    }

    try {
        const { wallet, mnemonic } = walletResult.payload;
        const [{ satsBalance }, bitcoinDepositAddress, lightningInvoice, transfersResult] =
            await Promise.all([
                wallet.getBalance(),
                wallet.getStaticDepositAddress(),
                getLightningInvoice(wallet),
                wallet.getTransfers(DEFAULT_TRANSFERS_PAGE_SIZE, 0),
            ]);

        return ok({
            balanceSats: satsBalance.available.toString(),
            bitcoinDepositAddress,
            lightningInvoice,
            mnemonic,
            transfers: transfersResult.transfers.map(mapSparkTransfer),
        });
    } catch (error) {
        return err({
            type: 'SparkWalletOperationFailed',
            message: getErrorMessage(error),
        });
    }
};
