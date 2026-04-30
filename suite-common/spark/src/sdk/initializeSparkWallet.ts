import { SparkWallet } from '@buildonspark/spark-sdk';

const SPARK_SDK_NETWORK = 'MAINNET';
const DEFAULT_SPARK_PRIVACY_ENABLED = true;

type InitializeSparkWalletParams = {
    accountNumber: number;
    mnemonic: string;
};

export const initializeSparkWallet = async ({
    accountNumber,
    mnemonic,
}: InitializeSparkWalletParams) => {
    const { wallet } = await SparkWallet.initialize({
        mnemonicOrSeed: mnemonic,
        accountNumber,
        options: {
            network: SPARK_SDK_NETWORK,
        },
    });

    await wallet.setPrivacyEnabled(DEFAULT_SPARK_PRIVACY_ENABLED);

    return wallet;
};
