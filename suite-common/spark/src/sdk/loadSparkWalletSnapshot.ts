import { type SparkWallet } from '@buildonspark/spark-sdk';

import { type Result, err, ok } from '@trezor/type-utils';

import { getErrorMessage } from './getErrorMessage';
import { getLightningInvoice } from './getLightningInvoice';
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

type LoadSparkWalletSnapshotParams = {
    mnemonic: string;
    wallet: SparkWallet;
};

export const loadSparkWalletSnapshot = async (
    params: LoadSparkWalletSnapshotParams,
): Promise<Result<SparkWalletSnapshot, SparkWalletClientError>> => {
    try {
        const [{ satsBalance }, bitcoinDepositAddress, lightningInvoice, transfersResult] =
            await Promise.all([
                params.wallet.getBalance(),
                params.wallet.getStaticDepositAddress(),
                getLightningInvoice(params.wallet),
                params.wallet.getTransfers(DEFAULT_TRANSFERS_PAGE_SIZE, 0),
            ]);

        return ok({
            balanceSats: satsBalance.available.toString(),
            bitcoinDepositAddress,
            lightningInvoice,
            mnemonic: params.mnemonic,
            transfers: transfersResult.transfers.map(mapSparkTransfer),
        });
    } catch (error) {
        return err({
            type: 'SparkWalletOperationFailed',
            message: getErrorMessage(error),
        });
    }
};
