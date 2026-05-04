import { type SparkWallet } from '@buildonspark/spark-sdk';

export const getSparkWalletBalance = async (wallet: SparkWallet) => {
    const { satsBalance } = await wallet.getBalance();

    return satsBalance.available.toString();
};
