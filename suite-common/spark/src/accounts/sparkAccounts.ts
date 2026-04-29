import type { WalletDescriptor } from '@suite-common/wallet-types';

export type SparkAccount = {
    accountNumber: number;
    walletDescriptor: WalletDescriptor;
    walletKey: string;
};

export const SPARK_NETWORK_SYMBOL = 'spark';

export const createSparkWalletKey = ({
    walletDescriptor,
    accountNumber,
}: {
    walletDescriptor: WalletDescriptor;
    accountNumber: number;
}) => `${walletDescriptor}:${accountNumber}`;
