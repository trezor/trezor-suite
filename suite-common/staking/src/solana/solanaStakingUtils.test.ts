import type { Account } from '@suite-common/wallet-types';
import { type SolanaStakingAccount } from '@trezor/blockchain-link-types';
import { StakeState } from '@trezor/network-solana/constants';

import { getSolanaUnstakeAmountBounds } from './solanaStakingUtils';

const SOL = 1_000_000_000;

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

const buildNonSolanaAccount = (): Account =>
    ({
        symbol: 'eth',
        networkType: 'ethereum',
        formattedBalance: '0',
        misc: {},
    }) as unknown as Account;

describe('getSolanaUnstakeAmountBounds', () => {
    it('returns null for non-Solana accounts', () => {
        expect(getSolanaUnstakeAmountBounds(buildNonSolanaAccount(), '1')).toBeNull();
    });

    it('returns null for zero, negative or invalid amounts', () => {
        const account = buildSolanaAccount([buildStakingAccount({ stake: `${3.12 * SOL}` })]);

        expect(getSolanaUnstakeAmountBounds(account, '0')).toBeNull();
        expect(getSolanaUnstakeAmountBounds(account, '-1')).toBeNull();
        expect(getSolanaUnstakeAmountBounds(account, 'abc')).toBeNull();
    });

    it('returns null when there are no active staking accounts', () => {
        const account = buildSolanaAccount([
            buildStakingAccount({ status: StakeState.Deactivating }),
        ]);

        expect(getSolanaUnstakeAmountBounds(account, '0.5')).toBeNull();
    });

    it('returns null when the requested amount covers the whole active stake', () => {
        const account = buildSolanaAccount([buildStakingAccount({ stake: `${1.42 * SOL}` })]);

        expect(getSolanaUnstakeAmountBounds(account, '1.42')).toBeNull();
        expect(getSolanaUnstakeAmountBounds(account, '2')).toBeNull();
    });

    it('returns null when both split legs stay above the minimum delegation', () => {
        const account = buildSolanaAccount([buildStakingAccount({ stake: `${3.12 * SOL}` })]);

        expect(getSolanaUnstakeAmountBounds(account, '1')).toBeNull();
        expect(getSolanaUnstakeAmountBounds(account, '1.5')).toBeNull();
        expect(getSolanaUnstakeAmountBounds(account, '2.12')).toBeNull();
    });

    it('suggests only the full amount when the account is too small to split', () => {
        const account = buildSolanaAccount([buildStakingAccount({ stake: `${1.42 * SOL}` })]);

        expect(getSolanaUnstakeAmountBounds(account, '1')).toEqual({ closestHigher: '1.42' });
        expect(getSolanaUnstakeAmountBounds(account, '0.5')).toEqual({ closestHigher: '1.42' });
    });

    it('suggests bounds around the invalid gap of a splittable account', () => {
        const account = buildSolanaAccount([buildStakingAccount({ stake: `${3.12 * SOL}` })]);

        expect(getSolanaUnstakeAmountBounds(account, '2.5')).toEqual({
            closestLower: '2.12',
            closestHigher: '3.12',
        });
        expect(getSolanaUnstakeAmountBounds(account, '0.42')).toEqual({ closestHigher: '1' });
    });

    it('consumes smaller accounts whole before splitting the next one', () => {
        const account = buildSolanaAccount([
            buildStakingAccount({ stake: `${2 * SOL}` }),
            buildStakingAccount({ stake: `${1.42 * SOL}` }),
        ]);

        expect(getSolanaUnstakeAmountBounds(account, '1.42')).toBeNull();
        expect(getSolanaUnstakeAmountBounds(account, '2')).toEqual({
            closestLower: '1.42',
            closestHigher: '2.42',
        });
        expect(getSolanaUnstakeAmountBounds(account, '3')).toEqual({
            closestLower: '2.42',
            closestHigher: '3.42',
        });
    });

    it('ignores accounts without stake and non-active accounts', () => {
        const account = buildSolanaAccount([
            buildStakingAccount({ stake: undefined }),
            buildStakingAccount({ stake: `${5 * SOL}`, status: StakeState.Deactivating }),
            buildStakingAccount({ stake: `${3.12 * SOL}` }),
        ]);

        expect(getSolanaUnstakeAmountBounds(account, '2.5')).toEqual({
            closestLower: '2.12',
            closestHigher: '3.12',
        });
    });

    it('returns null when the runtime switches to the capped DESC selection', () => {
        const account = buildSolanaAccount(
            Array.from({ length: 16 }, () => buildStakingAccount({ stake: `${2 * SOL}` })),
        );

        expect(getSolanaUnstakeAmountBounds(account, '1.5')).toBeNull();
    });
});
