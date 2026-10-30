import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { hasYieldDepositableBalance } from './contractTokenBalanceUtils';

const USDC_CONTRACT = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const WETH_CONTRACT = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

type AccountToken = NonNullable<Account['tokens']>[number];

const createToken = (contract: string, balance: string): AccountToken => ({
    contract,
    balance,
    symbol: 'TOKEN',
    decimals: 6,
    standard: 'ERC20',
});

const createAccount = (formattedBalance: string, tokens: AccountToken[] = []) =>
    mockWalletAccount({ symbol: asNetworkSymbol('eth'), formattedBalance, tokens });

describe('hasYieldDepositableBalance', () => {
    describe('token vault', () => {
        it('returns true when the account holds the vault token', () => {
            const account = createAccount('0', [createToken(USDC_CONTRACT, '25')]);

            expect(hasYieldDepositableBalance({ account, vaultTokenContract: USDC_CONTRACT })).toBe(
                true,
            );
        });

        it('returns false when the tracked vault token balance is zero', () => {
            const account = createAccount('5', [createToken(USDC_CONTRACT, '0')]);

            expect(hasYieldDepositableBalance({ account, vaultTokenContract: USDC_CONTRACT })).toBe(
                false,
            );
        });

        it('does not count the native balance for a token vault', () => {
            const account = createAccount('5');

            expect(hasYieldDepositableBalance({ account, vaultTokenContract: USDC_CONTRACT })).toBe(
                false,
            );
        });

        it('prefers an explicitly passed token balance over the tracked one', () => {
            const account = createAccount('0', [createToken(USDC_CONTRACT, '25')]);

            expect(
                hasYieldDepositableBalance({
                    account,
                    vaultTokenContract: USDC_CONTRACT,
                    tokenBalance: '0',
                }),
            ).toBe(false);
        });
    });

    describe('wrapped-native vault', () => {
        it('returns true when only the native balance is available', () => {
            const account = createAccount('0.5');

            expect(hasYieldDepositableBalance({ account, vaultTokenContract: WETH_CONTRACT })).toBe(
                true,
            );
        });

        it('returns true when only the wrapped token balance is available', () => {
            const account = createAccount('0', [createToken(WETH_CONTRACT, '1')]);

            expect(hasYieldDepositableBalance({ account, vaultTokenContract: WETH_CONTRACT })).toBe(
                true,
            );
        });

        it('counts an untracked wrapped balance passed explicitly', () => {
            const account = createAccount('0');

            expect(
                hasYieldDepositableBalance({
                    account,
                    vaultTokenContract: WETH_CONTRACT,
                    tokenBalance: '2',
                }),
            ).toBe(true);
        });

        it('returns false when both native and wrapped balances are zero', () => {
            const account = createAccount('0', [createToken(WETH_CONTRACT, '0')]);

            expect(hasYieldDepositableBalance({ account, vaultTokenContract: WETH_CONTRACT })).toBe(
                false,
            );
        });
    });

    it('returns false without a vault token contract', () => {
        const account = createAccount('5');

        expect(hasYieldDepositableBalance({ account, vaultTokenContract: null })).toBe(false);
    });
});
