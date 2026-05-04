import { type SparkWallet } from '@buildonspark/spark-sdk';

import { mapSparkTransfer } from './mapSparkTransfer';

const DEFAULT_TRANSFERS_PAGE_SIZE = 50;

export const getSparkWalletTransfers = async (wallet: SparkWallet) => {
    const transfersResult = await wallet.getTransfers(DEFAULT_TRANSFERS_PAGE_SIZE, 0);

    return transfersResult.transfers.map(mapSparkTransfer);
};
