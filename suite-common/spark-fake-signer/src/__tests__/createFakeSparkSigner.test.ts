const mockCreateSparkWalletFromSeed = jest.fn();
const mockGetIdentityPublicKey = jest.fn();

jest.mock('@buildonspark/spark-sdk', () => ({
    DefaultSparkSigner: jest.fn().mockImplementation(() => ({
        aggregateFrost: jest.fn(),
        createSparkWalletFromSeed: mockCreateSparkWalletFromSeed,
        decryptEcies: jest.fn(),
        generateMnemonic: jest.fn(),
        getDepositSigningKey: jest.fn(),
        getIdentityPublicKey: mockGetIdentityPublicKey,
        getNonceForSelfCommitment: jest.fn(),
        getPublicKeyFromDerivation: jest.fn(),
        getRandomSigningCommitment: jest.fn(),
        getStaticDepositSecretKey: jest.fn(),
        getStaticDepositSigningKey: jest.fn(),
        htlcHMAC: jest.fn(),
        mnemonicToSeed: jest.fn(),
        signFrost: jest.fn(),
        signMessageWithIdentityKey: jest.fn(),
        signSchnorrWithIdentityKey: jest.fn(),
        signTransactionIndex: jest.fn(),
        splitSecretWithProofs: jest.fn(),
        subtractAndSplitSecretWithProofsGivenDerivations: jest.fn(),
        subtractPrivateKeysGivenDerivationPaths: jest.fn(),
        subtractSplitAndEncrypt: jest.fn(),
        validateMessageWithIdentityKey: jest.fn(),
    })),
}));

import { createFakeSparkSigner } from '../createFakeSparkSigner';

describe('createFakeSparkSigner', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('initializes the fake signer with the provided Trezor secret', async () => {
        const fakeSparkSigner = await createFakeSparkSigner()({
            accountNumber: 7,
            trezorSecret: 'seed words',
        });

        expect(mockCreateSparkWalletFromSeed).toHaveBeenCalledWith('seed words', 7);
        expect(fakeSparkSigner).toBeDefined();
    });

    it('delegates signer methods to the underlying sdk signer', async () => {
        const fakeSparkSigner = await createFakeSparkSigner()({
            accountNumber: 1,
            trezorSecret: 'seed words',
        });

        await fakeSparkSigner.getIdentityPublicKey();

        expect(mockGetIdentityPublicKey).toHaveBeenCalledTimes(1);
    });
});
