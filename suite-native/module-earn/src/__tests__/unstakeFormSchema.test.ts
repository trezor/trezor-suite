import { type UnstakeFormContext, unstakeFormValidationSchema } from '../unstakeFormSchema';

const translate = ((id: string) => id) as UnstakeFormContext['translate'];

const validate = (amount: string, context: Omit<UnstakeFormContext, 'translate'>) =>
    unstakeFormValidationSchema.validate(
        { amount, fiat: '' },
        { context: { translate, ...context } },
    );

describe('unstakeFormValidationSchema — Solana minimum unstake amount', () => {
    const solContext = { symbol: 'sol', stakedBalance: '10', decimals: 9 } as const;

    it('rejects a Solana amount below the 1 SOL minimum delegation', async () => {
        await expect(validate('0.5', solContext)).rejects.toThrow(
            'earn.unstakeFormScreen.validation.amountBelowMin',
        );
    });

    it('accepts a Solana amount at or above the 1 SOL minimum', async () => {
        await expect(validate('1', solContext)).resolves.toBeDefined();
        await expect(validate('1.1', solContext)).resolves.toBeDefined();
    });

    it('does not apply the Solana minimum to other networks (e.g. Ethereum)', async () => {
        await expect(
            validate('0.5', { symbol: 'eth', stakedBalance: '10', decimals: 18 }),
        ).resolves.toBeDefined();
    });
});
