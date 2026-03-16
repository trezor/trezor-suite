import { type NetworkSymbol } from '@suite-common/wallet-config';

import { type FeesFormContext, feesFormValidationSchema } from '../feesFormSchema';

describe('feesFormValidationSchema', () => {
    const createContext = (overrides: Partial<FeesFormContext> = {}): FeesFormContext => ({
        symbol: 'eth' as NetworkSymbol,
        isEip1559Fee: false,
        networkFeeInfo: {
            minFee: 100,
            maxFee: 1000000,
            blockHeight: 0,
            blockTime: 0,
            minPriorityFee: 0,
            levels: [],
        },
        minimalFeeLimit: '21000',
        ...overrides,
    });

    describe('basic validation', () => {
        it('should validate a complete valid form', async () => {
            const data = {
                feeLevel: 'custom',
                customFeePerUnit: '500000', // Valid for Ethereum and within maxFee limit
                customFeeLimit: '50000',
            };
            const context = createContext();

            await expect(feesFormValidationSchema.validate(data, { context })).resolves.toEqual(
                data,
            );
        });

        it('should validate a complete valid form for bitcoin', async () => {
            const data = {
                feeLevel: 'custom',
                customFeePerUnit: '100.50',
                customFeeLimit: '1000',
            };
            const context = createContext({ symbol: 'btc' });

            await expect(feesFormValidationSchema.validate(data, { context })).resolves.toEqual(
                data,
            );
        });
    });

    describe('customFeeLimit validation', () => {
        it('should accept valid fee limit for ethereum', async () => {
            const data = {
                feeLevel: 'custom',
                customFeePerUnit: '500000', // Valid for Ethereum and within maxFee limit
                customFeeLimit: '50000',
            };
            const context = createContext({ minimalFeeLimit: '21000' });

            await expect(feesFormValidationSchema.validate(data, { context })).resolves.toEqual(
                data,
            );
        });

        it('should reject fee limit too low for ethereum', async () => {
            const data = {
                feeLevel: 'custom',
                customFeePerUnit: '500000', // Valid for Ethereum and within maxFee limit
                customFeeLimit: '10000',
            };

            const context = createContext({
                minimalFeeLimit: '21000',
                translate: () => 'Value is too low.',
            });

            await expect(feesFormValidationSchema.validate(data, { context })).rejects.toThrow(
                'Value is too low.',
            );
        });

        it('should pass for non-ethereum networks', async () => {
            const data = {
                feeLevel: 'custom',
                customFeePerUnit: '100.50', // Valid for Bitcoin (2 decimals)
                customFeeLimit: '1000',
            };
            const context = createContext({ symbol: 'btc', minimalFeeLimit: '21000' });

            await expect(feesFormValidationSchema.validate(data, { context })).resolves.toEqual(
                data,
            );
        });
    });

    describe('decimals validation', () => {
        it('should accept correct decimals for bitcoin', async () => {
            const data = { feeLevel: 'custom', customFeePerUnit: '100.50' };
            const context = createContext({ symbol: 'btc' });

            await expect(feesFormValidationSchema.validate(data, { context })).resolves.toEqual(
                data,
            );
        });

        it('should reject too many decimals for bitcoin', async () => {
            const data = { feeLevel: 'custom', customFeePerUnit: '100.123' };
            const context = createContext({ symbol: 'btc', translate: () => 'Too many decimals.' });

            await expect(feesFormValidationSchema.validate(data, { context })).rejects.toThrow(
                'Too many decimals.',
            );
        });

        it('should pass for non-bitcoin/ethereum networks', async () => {
            const data = { feeLevel: 'custom', customFeePerUnit: '100.123456789012345' };
            const context = createContext({ symbol: 'ada' });

            await expect(feesFormValidationSchema.validate(data, { context })).resolves.toEqual(
                data,
            );
        });
    });
});
