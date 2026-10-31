import { asNetworkSymbol } from '@suite-common/wallet-config';

import { type FeesFormContext, feesFormValidationSchema } from './feesFormSchema';

const btcSymbol = asNetworkSymbol('btc');
const ethSymbol = asNetworkSymbol('eth');
const adaSymbol = asNetworkSymbol('ada');

describe('feesFormValidationSchema', () => {
    const createContext = (overrides: Partial<FeesFormContext> = {}): FeesFormContext => ({
        symbol: ethSymbol,
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

    it.each(['customMaxFeePerGas', 'customMaxPriorityFeePerGas', 'customFeeLimit'])(
        'requires visible EIP-1559 field %s instead of silently keeping a hidden old value',
        async field => {
            const values: Record<string, string> = {
                feeLevel: 'custom',
                customFeePerUnit: '10',
                customFeeLimit: '21000',
                customMaxFeePerGas: '20',
                customMaxPriorityFeePerGas: '2',
            };
            values[field] = '';
            const context = createContext({
                isEip1559Fee: true,
                networkFeeInfo: {
                    minFee: 1,
                    maxFee: 100,
                    minPriorityFee: 1,
                    levels: [],
                    blockHeight: 0,
                    blockTime: 12,
                },
            });
            await expect(
                feesFormValidationSchema.validate(values, { context }),
            ).rejects.toMatchObject({ path: field });
        },
    );

    it('does not require inactive EIP-1559 inputs for a Standard fee', async () => {
        await expect(
            feesFormValidationSchema.validate(
                { feeLevel: 'normal', customFeePerUnit: '500000' },
                { context: createContext({ isEip1559Fee: true }) },
            ),
        ).resolves.toBeDefined();
    });

    it.each(['0', '1.5'])(
        'preserves Tron fee-limit validation for %s SUN',
        async customFeeLimit => {
            await expect(
                feesFormValidationSchema.validate(
                    { feeLevel: 'custom', customFeePerUnit: '500000', customFeeLimit },
                    {
                        context: createContext({
                            symbol: asNetworkSymbol('trx'),
                            minimalFeeLimit: '0',
                        }),
                    },
                ),
            ).resolves.toBeDefined();
        },
    );

    it.each(['eth', 'trx'] as const)(
        'requires the active Custom gas/fee limit on %s',
        async symbol => {
            await expect(
                feesFormValidationSchema.validate(
                    { feeLevel: 'custom', customFeePerUnit: '500000', customFeeLimit: '' },
                    {
                        context: createContext({
                            symbol: asNetworkSymbol(symbol),
                            isEip1559Fee: false,
                        }),
                    },
                ),
            ).rejects.toMatchObject({ path: 'customFeeLimit' });
        },
    );
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
            const context = createContext({ symbol: btcSymbol });

            await expect(feesFormValidationSchema.validate(data, { context })).resolves.toEqual(
                data,
            );
        });
    });

    describe('customFeeLimit validation', () => {
        it.each(['0', '-1', '21000.5', 'NaN', 'Infinity'])(
            'rejects invalid gas %s with an available estimate',
            async customFeeLimit => {
                await expect(
                    feesFormValidationSchema.validate(
                        {
                            feeLevel: 'custom',
                            customFeePerUnit: '500000',
                            customFeeLimit,
                        },
                        { context: createContext({ translate: () => 'Invalid gas limit.' }) },
                    ),
                ).rejects.toMatchObject({ path: 'customFeeLimit' });
            },
        );

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
            const context = createContext({ symbol: btcSymbol, minimalFeeLimit: '21000' });

            await expect(feesFormValidationSchema.validate(data, { context })).resolves.toEqual(
                data,
            );
        });
    });

    describe('decimals validation', () => {
        it('should accept correct decimals for bitcoin', async () => {
            const data = { feeLevel: 'custom', customFeePerUnit: '100.50' };
            const context = createContext({ symbol: btcSymbol });

            await expect(feesFormValidationSchema.validate(data, { context })).resolves.toEqual(
                data,
            );
        });

        it('should reject too many decimals for bitcoin', async () => {
            const data = { feeLevel: 'custom', customFeePerUnit: '100.123' };
            const context = createContext({
                symbol: btcSymbol,
                translate: () => 'Too many decimals.',
            });

            await expect(feesFormValidationSchema.validate(data, { context })).rejects.toThrow(
                'Too many decimals.',
            );
        });

        it('should pass for non-bitcoin/ethereum networks', async () => {
            const data = { feeLevel: 'custom', customFeePerUnit: '100.123456789012345' };
            const context = createContext({ symbol: adaSymbol });

            await expect(feesFormValidationSchema.validate(data, { context })).resolves.toEqual(
                data,
            );
        });
    });
});
