jest.mock('@buildonspark/spark-sdk', () => ({
    SparkWallet: {
        initialize: jest.fn(),
    },
}));

import { SparkWallet } from '@buildonspark/spark-sdk';

import { initializeSparkWallet } from '../initializeSparkWallet';

describe('initializeSparkWallet', () => {
    const mockSetPrivacyEnabled = jest.fn();
    const mockInitialize = jest.mocked(SparkWallet.initialize);

    beforeEach(() => {
        jest.clearAllMocks();

        mockInitialize.mockResolvedValue({
            wallet: {
                setPrivacyEnabled: mockSetPrivacyEnabled,
            },
        } as never);
    });

    it('initializes SparkWallet with a signer that already has keys', async () => {
        const signer = {};

        await initializeSparkWallet({
            accountNumber: 3,
            signer: signer as never,
        });

        expect(mockInitialize).toHaveBeenCalledWith({
            accountNumber: 3,
            signer,
            options: {
                network: 'MAINNET',
                signerWithPreExistingKeys: true,
            },
        });
        expect(mockSetPrivacyEnabled).toHaveBeenCalledWith(true);
    });
});
