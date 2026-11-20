import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type EvmSelectedFee } from '@suite-common/wallet-types';

import { buildStablecoinYieldTransactionReview } from './stablecoinYieldSigningUtils';

const SENDER = '0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3';
const VAULT = '0xd63070114470f685b75B74D60EEc7c1113d33a3D';
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const DEPOSIT_CALLDATA =
    '0x6e553f650000000000000000000000000000000000000000000000000000000005f5e1000000000000000000000000009ea3721b5bf3b64b4418c38b603154d2d597fae3';

const COMPOSED_GAS_LIMIT = '0x186a0';
const COMPOSED_MAX_FEE_PER_GAS = '0x3b9aca00';
const COMPOSED_MAX_PRIORITY_FEE_PER_GAS = '0x5f5e100';
const COMPOSED_GAS_PRICE = '0x2540be400';

const commonTransactionFields = {
    from: SENDER,
    to: VAULT,
    data: DEPOSIT_CALLDATA,
    value: '0x0',
    nonce: 12,
    chainId: 1,
    gasLimit: COMPOSED_GAS_LIMIT,
};

const eip1559UnsignedTransaction = JSON.stringify({
    ...commonTransactionFields,
    type: 2,
    maxFeePerGas: COMPOSED_MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: COMPOSED_MAX_PRIORITY_FEE_PER_GAS,
});

const legacyUnsignedTransaction = JSON.stringify({
    ...commonTransactionFields,
    gasPrice: COMPOSED_GAS_PRICE,
});

const legacySelectedFee: EvmSelectedFee = {
    type: 'legacy',
    gasLimit: '0x30d40',
    gasPrice: '0x4a817c800',
};

const eip1559SelectedFee: EvmSelectedFee = {
    type: 'eip1559',
    gasLimit: '0x30d40',
    maxFeePerGas: '0x4a817c800',
    maxPriorityFeePerGas: '0xbebc200',
    baseFeePerGas: '0x6b49d200',
};

const reviewParams = {
    amount: '100',
    token: { contractAddress: USDC, decimals: 6, symbol: 'USDC' },
    symbol: asNetworkSymbol('eth'),
};

const expectedSignedFields = {
    to: VAULT,
    value: '0x0',
    nonce: '0xc',
    data: DEPOSIT_CALLDATA,
    chainId: 1,
};

describe('buildStablecoinYieldTransactionReview', () => {
    it('keeps the composed fee when no fee was selected', () => {
        const { transactionForSigning } = buildStablecoinYieldTransactionReview({
            ...reviewParams,
            unsignedTransaction: eip1559UnsignedTransaction,
        });

        expect(transactionForSigning).toEqual({
            ...expectedSignedFields,
            gasLimit: COMPOSED_GAS_LIMIT,
            maxFeePerGas: COMPOSED_MAX_FEE_PER_GAS,
            maxPriorityFeePerGas: COMPOSED_MAX_PRIORITY_FEE_PER_GAS,
        });
    });

    it('signs with the selected legacy fee instead of the composed EIP-1559 fee', () => {
        const { transactionForSigning, precomposedTransaction, formState } =
            buildStablecoinYieldTransactionReview({
                ...reviewParams,
                unsignedTransaction: eip1559UnsignedTransaction,
                selectedFee: legacySelectedFee,
            });

        expect(transactionForSigning).toEqual({
            ...expectedSignedFields,
            gasLimit: legacySelectedFee.gasLimit,
            gasPrice: legacySelectedFee.gasPrice,
        });
        expect(precomposedTransaction.fee).toBe('4000000000000000');
        expect(precomposedTransaction.feePerByte).toBe('20');
        expect(precomposedTransaction.maxFeePerGas).toBeUndefined();
        expect(formState.maxFeePerGas).toBeUndefined();
    });

    it('signs with the selected EIP-1559 fee instead of the composed legacy fee', () => {
        const { transactionForSigning, precomposedTransaction } =
            buildStablecoinYieldTransactionReview({
                ...reviewParams,
                unsignedTransaction: legacyUnsignedTransaction,
                selectedFee: eip1559SelectedFee,
            });

        expect(transactionForSigning).toEqual({
            ...expectedSignedFields,
            gasLimit: eip1559SelectedFee.gasLimit,
            maxFeePerGas: eip1559SelectedFee.maxFeePerGas,
            maxPriorityFeePerGas: eip1559SelectedFee.maxPriorityFeePerGas,
        });
        expect(precomposedTransaction.fee).toBe('4000000000000000');
        expect(precomposedTransaction.maxFeePerGas).toBe('20');
        expect(precomposedTransaction.maxPriorityFeePerGas).toBe('0.2');
    });
});

const feeLevelReviewParams = {
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
            const params = { ...feeLevelReviewParams, selectedFeeLevel };
            const result = buildStablecoinYieldTransactionReview(params);

            expect(result.formState.selectedFee).toBe(selectedFeeLevel);
            expect(result.transactionForSigning.gasLimit).toBe('0x5208');
            expect(result.transactionForSigning).toMatchObject({ gasPrice: '0x3b9aca00' });
        },
    );

    it('keeps custom when no fee level is provided', () => {
        expect(
            buildStablecoinYieldTransactionReview(feeLevelReviewParams).formState.selectedFee,
        ).toBe('custom');
    });
    it('replaces EIP-1559 fields when a legacy fee is selected', () => {
        const result = buildStablecoinYieldTransactionReview({
            ...feeLevelReviewParams,
            unsignedTransaction: JSON.stringify({
                ...JSON.parse(feeLevelReviewParams.unsignedTransaction),
                type: 2,
                maxFeePerGas: '0x2540be400',
                maxPriorityFeePerGas: '0x3b9aca00',
            }),
            selectedFee: { type: 'legacy', gasPrice: '0x77359400', gasLimit: '0x30d40' },
        });
        expect(result.precomposedTransaction).toMatchObject({
            fee: '400000000000000',
            feePerByte: '2',
        });
        expect(result.precomposedTransaction.maxFeePerGas).toBeUndefined();
        expect(result.transactionForSigning).toMatchObject({
            gasPrice: '0x77359400',
            gasLimit: '0x30d40',
        });
        expect(result.transactionForSigning).not.toHaveProperty('txType', 2);
    });
});
