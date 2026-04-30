// cspell:ignore buildonspark
import { SparkWallet } from '@buildonspark/spark-sdk';

import { type SuiteSyncOwnerSecretHex } from '@suite-common/suite-sync-storage';
import { type Result, err, ok } from '@trezor/type-utils';

import { deriveSparkMnemonicFromSuiteSyncSecret } from './sparkMnemonic';
import { type SparkTransfer } from '../feature/sparkFeatureReducer';

const SPARK_SDK_NETWORK = 'MAINNET';
const DEFAULT_LIGHTNING_INVOICE_MEMO = 'Trezor Suite Spark deposit';
const DEFAULT_LIGHTNING_SEND_MAX_FEE_SATS = 1_000;
const DEFAULT_TRANSFERS_PAGE_SIZE = 50;

type SparkWalletClientError =
    | {
          type: 'SparkMnemonicDerivationFailed';
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

type SparkWalletSnapshot = {
    balanceSats: string;
    bitcoinDepositAddress: string;
    lightningInvoice: string;
    mnemonic: string;
    transfers: SparkTransfer[];
};

type SparkWalletClientParams = {
    accountNumber: number;
    ownerSecret: SuiteSyncOwnerSecretHex;
    walletKey: string;
};

type SparkWalletPaymentParams = SparkWalletClientParams & {
    amountSats?: string;
    invoice: string;
};

const sparkWalletPromises = new Map<string, Promise<SparkWallet>>();

const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) {
        return error.message;
    }

    if (typeof error === 'string') {
        return error;
    }

    return 'Unknown Spark SDK error';
};

const getSparkWalletMnemonic = (
    ownerSecret: SuiteSyncOwnerSecretHex,
): Result<string, SparkWalletClientError> => {
    const mnemonic = deriveSparkMnemonicFromSuiteSyncSecret(ownerSecret);

    if (!mnemonic.success) {
        return err({
            type: 'SparkMnemonicDerivationFailed',
            message: mnemonic.error.type,
        });
    }

    return ok(mnemonic.payload);
};

const getSdkWallet = async ({
    accountNumber,
    ownerSecret,
    walletKey,
}: SparkWalletClientParams): Promise<
    Result<{ mnemonic: string; wallet: SparkWallet }, SparkWalletClientError>
> => {
    const mnemonic = getSparkWalletMnemonic(ownerSecret);

    if (!mnemonic.success) {
        return mnemonic;
    }

    const existingWalletPromise = sparkWalletPromises.get(walletKey);

    if (existingWalletPromise) {
        try {
            const wallet = await existingWalletPromise;

            return ok({ mnemonic: mnemonic.payload, wallet });
        } catch (error) {
            sparkWalletPromises.delete(walletKey);

            return err({
                type: 'SparkWalletInitializationFailed',
                message: getErrorMessage(error),
            });
        }
    }

    const nextWalletPromise = SparkWallet.initialize({
        mnemonicOrSeed: mnemonic.payload,
        accountNumber,
        options: {
            network: SPARK_SDK_NETWORK,
        },
    }).then(({ wallet }) => wallet);

    sparkWalletPromises.set(walletKey, nextWalletPromise);

    try {
        const wallet = await nextWalletPromise;

        return ok({ mnemonic: mnemonic.payload, wallet });
    } catch (error) {
        sparkWalletPromises.delete(walletKey);

        return err({
            type: 'SparkWalletInitializationFailed',
            message: getErrorMessage(error),
        });
    }
};

const getLightningInvoice = async (wallet: SparkWallet) => {
    const request = await wallet.createLightningInvoice({
        amountSats: 0,
        includeSparkInvoice: true,
        memo: DEFAULT_LIGHTNING_INVOICE_MEMO,
    });

    return request.invoice.encodedInvoice;
};

const getTransferValue = (transfer: Record<string, unknown>) => {
    const { totalValue } = transfer;

    if (typeof totalValue === 'bigint') {
        return totalValue.toString();
    }

    if (typeof totalValue === 'number') {
        return totalValue.toString();
    }

    if (typeof totalValue === 'string') {
        return totalValue;
    }

    return '0';
};

const getTransferDirection = (transfer: Record<string, unknown>): SparkTransfer['direction'] =>
    transfer.transferDirection === 'OUTGOING' ? 'send' : 'receive';

const getTransferRail = (transfer: Record<string, unknown>): SparkTransfer['rail'] => {
    if (transfer.type === 'COOPERATIVE_EXIT') {
        return 'bitcoin';
    }

    const { userRequest } = transfer;

    if (typeof userRequest === 'object' && userRequest !== null) {
        const requestRecord = userRequest as Record<string, unknown>;
        const requestType = [
            requestRecord.type,
            requestRecord.__typename,
            requestRecord.constructor?.name,
        ]
            .filter(value => typeof value === 'string')
            .join(' ')
            .toUpperCase();

        if (requestType.includes('LIGHTNING')) {
            return 'lightning';
        }
    }

    return 'spark';
};

const getTransferSummary = (direction: SparkTransfer['direction'], rail: SparkTransfer['rail']) => {
    if (rail === 'bitcoin') {
        return direction === 'send' ? 'Bitcoin withdrawal' : 'Bitcoin deposit';
    }

    if (rail === 'lightning') {
        return direction === 'send' ? 'Lightning payment' : 'Lightning receipt';
    }

    return direction === 'send' ? 'Spark transfer sent' : 'Spark transfer received';
};

const railFallbackCounterpartyMap: Record<
    SparkTransfer['rail'],
    Record<SparkTransfer['direction'], string>
> = {
    bitcoin: {
        receive: 'Bitcoin deposit',
        send: 'Bitcoin withdrawal',
    },
    lightning: {
        receive: 'Lightning payer',
        send: 'Lightning invoice',
    },
    spark: {
        receive: 'Spark sender',
        send: 'Spark recipient',
    },
};

const getTransferCounterparty = (
    transfer: Record<string, unknown>,
    direction: SparkTransfer['direction'],
) => {
    const preferredField =
        direction === 'send'
            ? transfer.receiverIdentityPublicKey
            : transfer.senderIdentityPublicKey;

    if (typeof preferredField === 'string' && preferredField.length > 0) {
        return preferredField;
    }

    if (typeof transfer.sparkInvoice === 'string' && transfer.sparkInvoice.length > 0) {
        return transfer.sparkInvoice;
    }

    return railFallbackCounterpartyMap[getTransferRail(transfer)][direction];
};

const mapSparkTransfer = (transfer: unknown): SparkTransfer => {
    const transferRecord = typeof transfer === 'object' && transfer !== null ? transfer : {};
    const typedTransferRecord = transferRecord as Record<string, unknown>;
    const direction = getTransferDirection(typedTransferRecord);
    const rail = getTransferRail(typedTransferRecord);
    const createdAt = typedTransferRecord.createdTime;
    const updatedAt = typedTransferRecord.updatedTime;

    return {
        amountSats: getTransferValue(typedTransferRecord),
        counterparty: getTransferCounterparty(typedTransferRecord, direction),
        createdAt:
            // eslint-disable-next-line no-nested-ternary
            createdAt instanceof Date
                ? createdAt.toISOString()
                : updatedAt instanceof Date
                  ? updatedAt.toISOString()
                  : new Date().toISOString(),
        direction,
        id:
            typeof typedTransferRecord.id === 'string' && typedTransferRecord.id.length > 0
                ? typedTransferRecord.id
                : crypto.randomUUID(),
        rail,
        status:
            typeof typedTransferRecord.status === 'string' ? typedTransferRecord.status : 'UNKNOWN',
        summary: getTransferSummary(direction, rail),
    };
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

        return ok(undefined);
    } catch (error) {
        return err({
            type: 'SparkWalletOperationFailed',
            message: getErrorMessage(error),
        });
    }
};
