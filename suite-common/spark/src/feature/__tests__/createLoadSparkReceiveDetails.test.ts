import { getLightningInvoice } from '../../sdk/getLightningInvoice';
import { getSparkStaticDepositAddress } from '../../sdk/getSparkStaticDepositAddress';
import type { EnsureSparkWallet } from '../createEnsureSparkWallet';
import { createLoadSparkReceiveDetails } from '../createLoadSparkReceiveDetails';

jest.mock('../../sdk/getLightningInvoice', () => ({
    getLightningInvoice: jest.fn(),
}));

jest.mock('../../sdk/getSparkStaticDepositAddress', () => ({
    getSparkStaticDepositAddress: jest.fn(),
}));

const walletDescriptor = 'wallet-1' as never;

describe('createLoadSparkReceiveDetails', () => {
    const getLightningInvoiceMock = jest.mocked(getLightningInvoice);
    const getSparkStaticDepositAddressMock = jest.mocked(getSparkStaticDepositAddress);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('loads receive details lazily and stores them in redux', async () => {
        const dispatch = jest.fn();
        const ensureSparkWallet: EnsureSparkWallet = jest.fn().mockResolvedValue({
            success: true,
            payload: {
                mnemonic: 'mnemonic',
                wallet: { id: 'wallet' } as never,
                walletKey: 'wallet-1:0',
            },
        });

        getLightningInvoiceMock.mockResolvedValue('lnbc1invoice');
        getSparkStaticDepositAddressMock.mockResolvedValue('bc1qaddress');

        const loadSparkReceiveDetails = createLoadSparkReceiveDetails({
            dispatch,
            ensureSparkWallet,
        });

        const result = await loadSparkReceiveDetails({
            accountNumber: 0,
            deviceStaticSessionId: 'device@static-session:1',
            walletDescriptor,
        });

        expect(result).toBe(true);
        expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: {
                    accountNumber: 0,
                    bitcoinDepositAddress: 'bc1qaddress',
                    lightningInvoice: 'lnbc1invoice',
                    walletDescriptor,
                },
                type: '@suite-common/spark/setSparkWalletReceiveDetails',
            }),
        );
    });

    it('returns false when ensuring the Spark wallet fails', async () => {
        const dispatch = jest.fn();
        const ensureSparkWallet: EnsureSparkWallet = jest.fn().mockResolvedValue({
            success: false,
            error: {
                message: 'Spark unavailable',
                type: 'EnsureSparkOwnerSecretFailed',
            },
        });

        const loadSparkReceiveDetails = createLoadSparkReceiveDetails({
            dispatch,
            ensureSparkWallet,
        });

        const result = await loadSparkReceiveDetails({
            accountNumber: 0,
            deviceStaticSessionId: 'device@static-session:1',
            walletDescriptor,
        });

        expect(result).toBe(false);
        expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: {
                    accountNumber: 0,
                    error: 'Spark unavailable',
                    walletDescriptor,
                },
                type: '@suite-common/spark/setSparkWalletError',
            }),
        );
        expect(getLightningInvoiceMock).not.toHaveBeenCalled();
        expect(getSparkStaticDepositAddressMock).not.toHaveBeenCalled();
    });
});
