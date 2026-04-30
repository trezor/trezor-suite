import { type SparkWallet } from '@buildonspark/spark-sdk';

export type RunningSparkWallet = {
    mnemonic: string;
    wallet: SparkWallet;
    walletKey: string;
};

export type RunningSparkWalletRepository = {
    delete: (walletKey: string) => void;
    get: (walletKey: string) => Promise<RunningSparkWallet> | null;
    set: (walletKey: string, wallet: Promise<RunningSparkWallet>) => void;
};

export type RunningSparkWalletRepositoryDep = {
    runningSparkWalletRepository: RunningSparkWalletRepository;
};

export const createRunningSparkWalletRepository = (): RunningSparkWalletRepository => {
    const wallets = new Map<string, Promise<RunningSparkWallet>>();

    return {
        delete: walletKey => {
            wallets.delete(walletKey);
        },
        get: walletKey => wallets.get(walletKey) ?? null,
        set: (walletKey, wallet) => {
            wallets.set(walletKey, wallet);
        },
    };
};
