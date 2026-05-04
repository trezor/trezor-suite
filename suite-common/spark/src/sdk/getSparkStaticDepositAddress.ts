import { type SparkWallet } from '@buildonspark/spark-sdk';

export const getSparkStaticDepositAddress = (wallet: SparkWallet) =>
    wallet.getStaticDepositAddress();
