import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';

import { btcAccount, ethAccount } from '../__fixtures__/accounts';
import { mockTransaction } from '../__fixtures__/transactions';
import {
    type TokensRootState,
    selectAccountStakeTypeTransactionsWithTokenTransfers,
    selectAccountTokenInfo,
    selectAccountTransactionsWithTokenTransfers,
} from '../tokensSelectors';

describe('tokensSelectors', () => {
    const getState = () =>
        ({
            wallet: {
                accounts: [btcAccount, ethAccount],
            },
        }) as unknown as TokensRootState;

    describe('selectAccountTokenInfo', () => {
        it.each([
            ['0x4d224452801ACEd8B2F0aebE155379bb5D594381'],
            ['0x4d224452801aced8b2f0aebe155379bb5d594381'],
            ['0X4D224452801ACED8B2F0AEBE155379BB5D594381'],
        ])('should return ApeCoin for tokenAddress [%s]', tokenAddressString => {
            expect(
                selectAccountTokenInfo(
                    getState(),
                    ethAccount.key,
                    tokenAddressString as TokenAddress,
                ),
            ).toEqual({
                balance: '0',
                contract: '0x4d224452801ACEd8B2F0aebE155379bb5D594381',
                decimals: 18,
                name: 'ApeCoin',
                standard: 'ERC20',
                symbol: 'ape',
                transfers: 2,
            });
        });

        it('should return null, when no token was found', () => {
            expect(
                selectAccountTokenInfo(
                    getState(),
                    ethAccount.key,
                    'UNKNOWN_TOKEN_ADDRESS' as TokenAddress,
                ),
            ).toBeNull();
        });

        it('should return null, when account was not found', () => {
            expect(
                selectAccountTokenInfo(
                    getState(),
                    'UNKNOWN_ACCOUNT_KEY' as AccountKey, // Todo: create properly via `createAccountKey()`
                    '0x4d224452801ACEd8B2F0aebE155379bb5D594381' as TokenAddress,
                ),
            ).toBeNull();
        });
    });

    describe('selectAccountTransactionsWithTokenTransfers', () => {
        const accountKey = ethAccount.key as AccountKey;
        const getStateWithTransactions = (transactions: (typeof mockTransaction)[]) =>
            ({
                wallet: {
                    accounts: [ethAccount],
                    transactions: {
                        transactions: { [accountKey]: transactions },
                        fetchStatusDetail: {},
                    },
                },
            }) as unknown as TokensRootState;

        it('returns the same reference across repeated calls when state is unchanged', () => {
            const state = getStateWithTransactions([mockTransaction]);
            const first = selectAccountTransactionsWithTokenTransfers(state, accountKey);
            const second = selectAccountTransactionsWithTokenTransfers(state, accountKey);
            expect(first).toBe(second);
        });

        it('returns the same stable empty-array reference when there are no transactions', () => {
            const state = getStateWithTransactions([]);
            const first = selectAccountTransactionsWithTokenTransfers(state, accountKey);
            const second = selectAccountTransactionsWithTokenTransfers(state, accountKey);
            expect(first).toEqual([]);
            expect(first).toBe(second);
        });

        it('passes the underlying transactions through unchanged', () => {
            const state = getStateWithTransactions([mockTransaction]);
            const result = selectAccountTransactionsWithTokenTransfers(state, accountKey);
            expect(result).toHaveLength(1);
            expect(result[0].txid).toBe(mockTransaction.txid);
            expect(result[0].tokens).toBe(mockTransaction.tokens);
        });
    });

    describe('selectAccountStakeTypeTransactionsWithTokenTransfers', () => {
        const accountKey = ethAccount.key as AccountKey;
        const getStateWithTransactions = (transactions: (typeof mockTransaction)[]) =>
            ({
                wallet: {
                    accounts: [ethAccount],
                    transactions: {
                        transactions: { [accountKey]: transactions },
                        fetchStatusDetail: {},
                    },
                },
            }) as unknown as TokensRootState;

        it('returns the same stable empty-array reference when there are no stake-type transactions', () => {
            const state = getStateWithTransactions([mockTransaction]);
            const first = selectAccountStakeTypeTransactionsWithTokenTransfers(state, accountKey);
            const second = selectAccountStakeTypeTransactionsWithTokenTransfers(state, accountKey);
            expect(first).toEqual([]);
            expect(first).toBe(second);
        });
    });
});
