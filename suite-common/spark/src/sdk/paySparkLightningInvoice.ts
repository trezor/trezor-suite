import { type Result, err, ok } from '@trezor/type-utils';

import { getErrorMessage } from './getErrorMessage';
import { type SparkWalletClientParams, getSdkWallet } from './getSdkWallet';
import { type SparkWalletClientError } from './getSparkWalletMnemonic';

const DEFAULT_LIGHTNING_SEND_MAX_FEE_SATS = 1_000;

type SparkWalletPaymentParams = SparkWalletClientParams & {
    amountSats?: string;
    invoice: string;
};

export const paySparkLightningInvoice = async (
    params: SparkWalletPaymentParams,
): Promise<Result<void, SparkWalletClientError>> => {
    const walletResult = await getSdkWallet(params);

    if (!walletResult.success) {
        return walletResult;
    }

    const amountSatsToSend = params.amountSats?.trim();

    try {
        await walletResult.payload.wallet.payLightningInvoice({
            invoice: params.invoice,
            ...(amountSatsToSend ? { amountSatsToSend: Number(amountSatsToSend) } : {}),
            idempotencyKey: `${params.walletKey}:${params.invoice}`,
            maxFeeSats: DEFAULT_LIGHTNING_SEND_MAX_FEE_SATS,
            preferSpark: true,
        });

        return ok();
    } catch (error) {
        return err({
            type: 'SparkWalletOperationFailed',
            message: getErrorMessage(error),
        });
    }
};
