import { type SparkSigner, SparkWallet } from '@buildonspark/spark-sdk';

const SPARK_SDK_NETWORK = 'MAINNET';
const DEFAULT_SPARK_PRIVACY_ENABLED = true;

type InitializeSparkWalletParams = {
    accountNumber: number;
    signer: SparkSigner;
};

export const initializeSparkWallet = async ({
    accountNumber,
    signer,
}: InitializeSparkWalletParams) => {
    const { wallet } = await SparkWallet.initialize({
        accountNumber,
        signer,
        options: {
            network: SPARK_SDK_NETWORK,
            signerWithPreExistingKeys: true,
        },
    });

    await wallet.setPrivacyEnabled(DEFAULT_SPARK_PRIVACY_ENABLED);

    return wallet;
};
