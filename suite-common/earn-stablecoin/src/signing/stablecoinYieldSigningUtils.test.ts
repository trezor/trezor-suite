import { asNetworkSymbol } from '@suite-common/wallet-config';

import { buildStablecoinYieldTransactionReview } from './stablecoinYieldSigningUtils';

const reviewParams = {
    amount: '1',
    token: { decimals: 18, symbol: 'ETH' },
    symbol: asNetworkSymbol('eth'),
    unsignedTransaction: JSON.stringify({
        from: '0x1111111111111111111111111111111111111111',
        to: '0x2222222222222222222222222222222222222222',
        data: '0x',
        chainId: 1,
        gasLimit: '0x5208',
        nonce: '0x1',
        gasPrice: '0x3b9aca00',
    }),
};

describe('buildStablecoinYieldTransactionReview fee selection', () => {
    it.each(['low', 'normal', 'high', 'custom'] as const)(
        'preserves the selected %s fee level in the review form',
        selectedFeeLevel => {
            const params = { ...reviewParams, selectedFeeLevel };
            const result = buildStablecoinYieldTransactionReview(params);

            expect(result.formState.selectedFee).toBe(selectedFeeLevel);
            expect(result.transactionForSigning.gasLimit).toBe('0x5208');
            expect(result.transactionForSigning).toMatchObject({ gasPrice: '0x3b9aca00' });
        },
    );

    it('keeps custom when no fee level is provided', () => {
        expect(buildStablecoinYieldTransactionReview(reviewParams).formState.selectedFee).toBe(
            'custom',
        );
    });
});
