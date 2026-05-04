import { type SparkWallet } from '@buildonspark/spark-sdk';

import { type Result, err, ok } from '@trezor/type-utils';

import { getErrorMessage } from './getErrorMessage';

export type SparkWalletClientError =
    | {
          type: 'SparkSignerInitializationFailed';
          message: string;
      }
    | {
          type: 'SparkWalletInitializationFailed';
          message: string;
      }
    | {
          type: 'SparkWalletOperationFailed';
          message: string;
      };

const DEFAULT_LIGHTNING_SEND_MAX_FEE_SATS = 1_000;

type SparkWalletPaymentParams = {
    amountSats?: string;
    invoice: string;
    wallet: SparkWallet;
    walletKey: string;
};

export const paySparkLightningInvoice = async (
    params: SparkWalletPaymentParams,
): Promise<Result<void, SparkWalletClientError>> => {
    const amountSatsToSend = params.amountSats?.trim();

    try {
        await params.wallet.payLightningInvoice({
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
