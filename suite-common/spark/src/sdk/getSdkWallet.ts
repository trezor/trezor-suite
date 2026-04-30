import { type SparkWallet } from '@buildonspark/spark-sdk';

import { type SuiteSyncOwnerSecretHex } from '@suite-common/suite-sync-storage';
import { type Result, err, ok } from '@trezor/type-utils';

import { getErrorMessage } from './getErrorMessage';
import { type SparkWalletClientError, getSparkWalletMnemonic } from './getSparkWalletMnemonic';
import { initializeSparkWallet } from './initializeSparkWallet';

export type SparkWalletClientParams = {
    accountNumber: number;
    ownerSecret: SuiteSyncOwnerSecretHex;
    walletKey: string;
};

export type SparkWalletResult = {
    mnemonic: string;
    wallet: SparkWallet;
};

const sparkWalletPromises = new Map<string, Promise<SparkWalletResult['wallet']>>();

export const getSdkWallet = async ({
    accountNumber,
    ownerSecret,
    walletKey,
}: SparkWalletClientParams): Promise<Result<SparkWalletResult, SparkWalletClientError>> => {
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

    const nextWalletPromise = initializeSparkWallet({
        accountNumber,
        mnemonic: mnemonic.payload,
    });

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
