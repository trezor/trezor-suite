import { asNetworkSymbol } from '@suite-common/wallet-config';
import TrezorConnect from '@trezor/connect';

import { estimateYieldFeeLevel } from './stablecoinYieldFeeEstimation';

jest.mock('@trezor/connect', () => ({
    __esModule: true,
    default: { blockchainEstimateFee: jest.fn() },
}));

const params = {
    coin: asNetworkSymbol('eth'),
    identity: 'mock-identity',
    from: '0xfrom',
    to: '0xto',
    data: '0xdata',
} as const;

const feeLevel = { feeLimit: '750000', feePerUnit: '1' };

const mockEstimateFeeResponse = (response: unknown) => {
    (TrezorConnect.blockchainEstimateFee as jest.Mock).mockResolvedValue(response);
};

describe(estimateYieldFeeLevel.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns the estimated fee level on success', async () => {
        mockEstimateFeeResponse({
            success: true,
            payload: { levels: [feeLevel] },
        });

        await expect(estimateYieldFeeLevel(params)).resolves.toEqual({
            success: true,
            payload: feeLevel,
        });
    });

    it.each([
        {
            description: 'the estimate request fails',
            response: {
                success: false,
                error: { message: 'Network error', code: 'Method_Discovery' },
            },
        },
        {
            description: 'the fee level is missing a gas limit',
            response: { success: true, payload: { levels: [{ feePerUnit: '1' }] } },
        },
        {
            description: 'no fee levels are returned',
            response: { success: true, payload: { levels: [] } },
        },
    ])('fails when $description', async ({ response }) => {
        mockEstimateFeeResponse(response);

        await expect(estimateYieldFeeLevel(params)).resolves.toEqual({
            success: false,
            error: 'fee-estimation-failed',
        });
    });
});
