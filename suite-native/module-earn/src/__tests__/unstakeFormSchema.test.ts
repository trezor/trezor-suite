import { type Account } from '@suite-common/wallet-types';
import { type SolanaStakingAccount } from '@trezor/blockchain-link-types';
import { StakeState } from '@trezor/network-solana/constants';

import { type UnstakeFormContext, unstakeFormValidationSchema } from '../unstakeFormSchema';

const SOL = 1_000_000_000;

const translate = ((id: string, values?: Record<string, unknown>) =>
    values ? `${id}:${JSON.stringify(values)}` : id) as UnstakeFormContext['translate'];

const validate = (amount: string, context: Omit<UnstakeFormContext, 'translate'>) =>
    unstakeFormValidationSchema.validate(
        { amount, fiat: '' },
        { context: { translate, ...context } },
    );

const buildStakingAccount = (
    overrides: Partial<SolanaStakingAccount> = {},
): SolanaStakingAccount => ({
    status: StakeState.Active,
    stake: `${SOL}`,
    rentExemptReserve: '2282880',
    ...overrides,
});

const buildSolanaAccount = (solStakingAccounts: SolanaStakingAccount[]): Account =>
    ({
        symbol: 'sol',
        networkType: 'solana',
        formattedBalance: '0',
        misc: { solStakingAccounts },
    }) as unknown as Account;

describe('unstakeFormValidationSchema — Solana unstake amount bounds', () => {
    it('rejects a Solana amount below the 1 SOL minimum delegation (single small account)', async () => {
        const account = buildSolanaAccount([buildStakingAccount({ stake: `${1.42 * SOL}` })]);

        await expect(
            validate('0.5', { account, symbol: 'sol', stakedBalance: '1.42', decimals: 9 }),
        ).rejects.toThrow('earn.unstakeFormScreen.validation.invalidUnstakeAmountHigherOnly');
    });

    it('accepts a Solana amount that can be validly split across accounts', async () => {
        const account = buildSolanaAccount([
            buildStakingAccount({ stake: `${2 * SOL}` }),
            buildStakingAccount({ stake: `${1.42 * SOL}` }),
        ]);

        await expect(
            validate('1.42', { account, symbol: 'sol', stakedBalance: '3.42', decimals: 9 }),
        ).resolves.toBeDefined();
    });

    it('rejects an amount that would leave an invalid split remainder, suggesting both bounds', async () => {
        const account = buildSolanaAccount([
            buildStakingAccount({ stake: `${2 * SOL}` }),
            buildStakingAccount({ stake: `${1.42 * SOL}` }),
        ]);

        await expect(
            validate('2', { account, symbol: 'sol', stakedBalance: '3.42', decimals: 9 }),
        ).rejects.toThrow(/invalidUnstakeAmount(?!HigherOnly)/);
    });

    it('rejects an amount too small to split, suggesting only the higher bound', async () => {
        const account = buildSolanaAccount([buildStakingAccount({ stake: `${3.12 * SOL}` })]);

        await expect(
            validate('0.42', { account, symbol: 'sol', stakedBalance: '3.12', decimals: 9 }),
        ).rejects.toThrow('earn.unstakeFormScreen.validation.invalidUnstakeAmountHigherOnly');
    });

    it('does not apply the Solana bounds check to other networks (e.g. Ethereum)', async () => {
        await expect(
            validate('0.5', { symbol: 'eth', stakedBalance: '10', decimals: 18 }),
        ).resolves.toBeDefined();
    });
});
