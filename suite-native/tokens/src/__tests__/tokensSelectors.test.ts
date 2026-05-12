import { type TrezorDevice } from '@suite-common/suite-types';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';

import { btcAccount, ethAccount } from '../__fixtures__/accounts';
import { mockTransaction } from '../__fixtures__/transactions';
import {
    type TokensRootState,
    selectAccountStakeTypeTransactionsWithTokenTransfers,
    selectAccountTokenInfo,
    selectAccountTransactionsWithTokenTransfers,
    selectHasDeviceAnyTokensWithBalanceForNetwork,
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

    describe('selectHasDeviceAnyTokensWithBalanceForNetwork', () => {
        const ethDeviceState = ethAccount.deviceState as string;
        const usdtContractLower = '0xdac17f958d2ee523a2206206994597c13d831ec7';
        const apeContractLower = '0x4d224452801aced8b2f0aebe155379bb5d594381';
        const sfContractLower = '0xed314bf44013612e8c00abd3cb6eade61cc8c72e';

        const buildTestState = (
            tokenDefinitions: Record<string, unknown>,
            accounts = [btcAccount, ethAccount],
        ) =>
            ({
                wallet: {
                    accounts,
                },
                device: {
                    devices: [
                        {
                            state: {
                                sessionId: '1',
                                staticSessionId: ethDeviceState,
                            },
                        } as TrezorDevice,
                    ],
                    selectedDevice: {
                        state: {
                            sessionId: '1',
                            staticSessionId: ethDeviceState,
                        },
                    } as TrezorDevice,
                },
                tokenDefinitions,
            }) as unknown as TokensRootState;

        const definitionsWithUsdt = {
            eth: { coin: { data: [usdtContractLower] } },
        };

        const definitionsWithApe = {
            eth: { coin: { data: [apeContractLower] } },
        };

        const definitionsWithSf = {
            eth: { coin: { data: [sfContractLower] } },
        };

        it('returns true when at least one known token has a positive balance', () => {
            // The eth fixture's 'sf' token is the only one with a positive balance ('1');
            // adding it to the known list should flip the result to true.
            const state = buildTestState(definitionsWithSf);
            expect(selectHasDeviceAnyTokensWithBalanceForNetwork(state, 'eth')).toBe(true);
        });

        it('returns false when no known token has a positive balance (ape is known but balance is 0)', () => {
            const state = buildTestState(definitionsWithApe);

            expect(selectHasDeviceAnyTokensWithBalanceForNetwork(state, 'eth')).toBe(false);
        });

        it('returns false when there are tokens with balance but none are in the known list', () => {
            // 'sf' has balance '1' but is NOT in definitionsWithUsdt; usdt is known but balance is 0.
            const state = buildTestState(definitionsWithUsdt);

            expect(selectHasDeviceAnyTokensWithBalanceForNetwork(state, 'eth')).toBe(false);
        });

        it('returns the same primitive across repeated calls when state is unchanged', () => {
            const state = buildTestState(definitionsWithApe);
            const first = selectHasDeviceAnyTokensWithBalanceForNetwork(state, 'eth');
            const second = selectHasDeviceAnyTokensWithBalanceForNetwork(state, 'eth');
            expect(first).toBe(second);
        });

        it('returns false for a network that does not support tokens (e.g. btc)', () => {
            const state = buildTestState(definitionsWithApe);
            expect(selectHasDeviceAnyTokensWithBalanceForNetwork(state, 'btc')).toBe(false);
        });
    });
});
