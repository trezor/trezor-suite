import { DefaultSparkSigner, type SparkSigner } from '@buildonspark/spark-sdk';

export type CreateFakeSparkSignerParams = {
    accountNumber: number;
    trezorSecret: Uint8Array | string;
};

export type CreateFakeSparkSigner = (params: CreateFakeSparkSignerParams) => Promise<SparkSigner>;

export type CreateFakeSparkSignerDep = {
    createFakeSparkSigner: CreateFakeSparkSigner;
};

export class FakeSparkSigner implements SparkSigner {
    private readonly sparkSigner: SparkSigner = new DefaultSparkSigner();

    init = async ({ accountNumber, trezorSecret }: CreateFakeSparkSignerParams): Promise<void> => {
        await this.sparkSigner.createSparkWalletFromSeed(trezorSecret, accountNumber);
    };

    getIdentityPublicKey: SparkSigner['getIdentityPublicKey'] = () =>
        this.sparkSigner.getIdentityPublicKey();

    getDepositSigningKey: SparkSigner['getDepositSigningKey'] = () =>
        this.sparkSigner.getDepositSigningKey();

    getStaticDepositSigningKey: SparkSigner['getStaticDepositSigningKey'] = idx =>
        this.sparkSigner.getStaticDepositSigningKey(idx);

    getStaticDepositSecretKey: SparkSigner['getStaticDepositSecretKey'] = idx =>
        this.sparkSigner.getStaticDepositSecretKey(idx);

    generateMnemonic: SparkSigner['generateMnemonic'] = () => this.sparkSigner.generateMnemonic();

    mnemonicToSeed: SparkSigner['mnemonicToSeed'] = mnemonic =>
        this.sparkSigner.mnemonicToSeed(mnemonic);

    signSchnorrWithIdentityKey: SparkSigner['signSchnorrWithIdentityKey'] = message =>
        this.sparkSigner.signSchnorrWithIdentityKey(message);

    signFrost: SparkSigner['signFrost'] = params => this.sparkSigner.signFrost(params);

    aggregateFrost: SparkSigner['aggregateFrost'] = params =>
        this.sparkSigner.aggregateFrost(params);

    decryptEcies: SparkSigner['decryptEcies'] = ciphertext =>
        this.sparkSigner.decryptEcies(ciphertext);

    getRandomSigningCommitment: SparkSigner['getRandomSigningCommitment'] = () =>
        this.sparkSigner.getRandomSigningCommitment();

    getNonceForSelfCommitment: SparkSigner['getNonceForSelfCommitment'] = selfCommitment =>
        this.sparkSigner.getNonceForSelfCommitment(selfCommitment);

    createSparkWalletFromSeed: SparkSigner['createSparkWalletFromSeed'] = (seed, accountNumber) =>
        this.sparkSigner.createSparkWalletFromSeed(seed, accountNumber);

    getPublicKeyFromDerivation: SparkSigner['getPublicKeyFromDerivation'] = keyDerivation =>
        this.sparkSigner.getPublicKeyFromDerivation(keyDerivation);

    subtractPrivateKeysGivenDerivationPaths: SparkSigner['subtractPrivateKeysGivenDerivationPaths'] =
        (first, second) => this.sparkSigner.subtractPrivateKeysGivenDerivationPaths(first, second);

    subtractAndSplitSecretWithProofsGivenDerivations: SparkSigner['subtractAndSplitSecretWithProofsGivenDerivations'] =
        params => this.sparkSigner.subtractAndSplitSecretWithProofsGivenDerivations(params);

    subtractSplitAndEncrypt: SparkSigner['subtractSplitAndEncrypt'] = params =>
        this.sparkSigner.subtractSplitAndEncrypt(params);

    splitSecretWithProofs: SparkSigner['splitSecretWithProofs'] = params =>
        this.sparkSigner.splitSecretWithProofs(params);

    signMessageWithIdentityKey: SparkSigner['signMessageWithIdentityKey'] = (message, compact) =>
        this.sparkSigner.signMessageWithIdentityKey(message, compact);

    validateMessageWithIdentityKey: SparkSigner['validateMessageWithIdentityKey'] = (
        message,
        signature,
    ) => this.sparkSigner.validateMessageWithIdentityKey(message, signature);

    signTransactionIndex: SparkSigner['signTransactionIndex'] = (tx, index, publicKey) => {
        this.sparkSigner.signTransactionIndex(tx, index, publicKey);
    };

    htlcHMAC: SparkSigner['htlcHMAC'] = transferID => this.sparkSigner.htlcHMAC(transferID);
}

export const createFakeSparkSigner = (): CreateFakeSparkSigner => async params => {
    const fakeSparkSigner = new FakeSparkSigner();

    await fakeSparkSigner.init(params);

    return fakeSparkSigner;
};
