import { type SparkWallet } from '@buildonspark/spark-sdk';

const DEFAULT_LIGHTNING_INVOICE_MEMO = 'Trezor Suite Spark deposit';

export const getLightningInvoice = async (wallet: SparkWallet) => {
    const request = await wallet.createLightningInvoice({
        amountSats: 0,
        includeSparkInvoice: true,
        memo: DEFAULT_LIGHTNING_INVOICE_MEMO,
    });

    return request.invoice.encodedInvoice;
};
