import { type TokenDefinition } from '@suite-common/token-definitions';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { getAccountAnalyticsTokenSymbols, getTokens } from './tokenUtils';

const ethSymbol = asNetworkSymbol('eth');

const legitContract = '0x' + 'a'.repeat(40);
const spamContract = '0x' + 'b'.repeat(40);
const hiddenContract = '0x' + 'c'.repeat(40);
const zeroBalanceContract = '0x' + 'e'.repeat(40);

const ethDefinitions: TokenDefinition = {
    error: false,
    isLoading: false,
    data: [legitContract, hiddenContract, zeroBalanceContract],
    hide: [hiddenContract],
    show: [],
};

describe('getTokens visibility', () => {
    const mixedCaseContract = '0x' + 'aB'.repeat(20);
    const lowercaseContract = mixedCaseContract.toLowerCase();

    describe.each(['xlm', 'txlm'])('activated Stellar tokens on %s', networkSymbol => {
        const symbol = asNetworkSymbol(networkSymbol);
        const token = mockAccountToken({
            contract: 'USDC-GIssuer',
            standard: 'STELLAR-CLASSIC',
            balance: '5',
        });

        it.each([undefined, { ...ethDefinitions, data: [], hide: [] }])(
            'shows trustlines independently of token definitions (%j)',
            tokenDefinitions => {
                const zeroBalanceToken = { ...token, contract: 'ZERO-GIssuer', balance: '0' };
                const result = getTokens({
                    symbol,
                    tokens: [token, zeroBalanceToken],
                    tokenDefinitions,
                });

                expect(result.shownWithBalance).toEqual([token]);
                expect(result.shownWithoutBalance).toEqual([zeroBalanceToken]);
                expect(result.unverifiedWithBalance).toEqual([]);
                expect(result.unverifiedWithoutBalance).toEqual([]);
            },
        );

        it('respects manually hidden trustlines outside token definitions', () => {
            const result = getTokens({
                symbol,
                tokens: [token],
                tokenDefinitions: { ...ethDefinitions, data: [], hide: [token.contract] },
            });

            expect(result.shownWithBalance).toEqual([]);
            expect(result.hiddenWithBalance).toEqual([token]);
        });
    });

    describe.each(['eth', 'base'])('%s', networkSymbol => {
        const symbol = asNetworkSymbol(networkSymbol);

        it.each([
            [mixedCaseContract, lowercaseContract],
            [lowercaseContract, mixedCaseContract],
        ])('hides %s using persisted visibility %s', (contract, persistedContract) => {
            const token = mockAccountToken({ contract, balance: '1' });
            const result = getTokens({
                symbol,
                tokens: [token],
                tokenDefinitions: {
                    ...ethDefinitions,
                    data: [lowercaseContract],
                    hide: [persistedContract],
                },
            });

            expect(result.shownWithBalance).toEqual([]);
            expect(result.hiddenWithBalance).toEqual([token]);
        });

        it.each([
            [mixedCaseContract, lowercaseContract],
            [lowercaseContract, mixedCaseContract],
        ])('shows unverified %s using persisted visibility %s', (contract, shownContract) => {
            const token = mockAccountToken({ contract, balance: '1' });
            const result = getTokens({
                symbol,
                tokens: [token],
                tokenDefinitions: { ...ethDefinitions, data: [], show: [shownContract] },
            });

            expect(result.shownWithBalance).toEqual([token]);
            expect(result.unverifiedWithBalance).toEqual([]);
        });
    });

    it.each([
        { symbol: asNetworkSymbol('sol'), standard: 'SPL' as const },
        { symbol: asNetworkSymbol('xlm'), standard: 'STELLAR-CLASSIC' as const },
    ])('keeps visibility case-sensitive on $symbol', ({ symbol, standard }) => {
        const token = mockAccountToken({ contract: 'AbCd', standard, balance: '1' });
        const result = getTokens({
            symbol,
            tokens: [token],
            tokenDefinitions: {
                ...ethDefinitions,
                data: ['AbCd'],
                hide: ['abcd'],
                show: [],
            },
        });

        expect(result.shownWithBalance).toEqual([token]);
        expect(result.hiddenWithBalance).toEqual([]);

        const hidden = getTokens({
            symbol,
            tokens: [token],
            tokenDefinitions: {
                ...ethDefinitions,
                data: ['AbCd'],
                hide: ['AbCd'],
                show: ['abcd'],
            },
        });

        expect(hidden.shownWithBalance).toEqual([]);
        expect(hidden.hiddenWithBalance).toEqual([token]);
    });

    it('keeps Cardano assets under the same policy distinct', () => {
        const policyId = 'a'.repeat(56);
        const hidden = mockAccountToken({
            contract: policyId + '416c706861',
            standard: 'BLOCKFROST',
            balance: '1',
        });
        const visible = mockAccountToken({
            contract: policyId + '42657461',
            standard: 'BLOCKFROST',
            balance: '1',
        });
        const result = getTokens({
            symbol: asNetworkSymbol('ada'),
            tokens: [hidden, visible],
            tokenDefinitions: { ...ethDefinitions, data: [policyId], hide: [hidden.contract] },
        });

        expect(result.shownWithBalance).toEqual([visible]);
        expect(result.hiddenWithBalance).toEqual([hidden]);
    });

    it('applies EVM visibility matching to NFTs', () => {
        const token = mockAccountToken({
            contract: mixedCaseContract,
            standard: 'ERC721',
            balance: '1',
        });
        const result = getTokens({
            symbol: ethSymbol,
            tokens: [token],
            isNft: true,
            tokenDefinitions: {
                ...ethDefinitions,
                data: [lowercaseContract],
                hide: [lowercaseContract],
            },
        });

        expect(result.shownWithBalance).toEqual([]);
        expect(result.hiddenWithBalance).toEqual([token]);
    });
});

describe('getAccountAnalyticsTokenSymbols', () => {
    it('lists the native token first when the account holds a native balance', () => {
        const account = mockWalletAccount({
            symbol: ethSymbol,
            balance: '1000',
            tokens: [],
        });

        expect(getAccountAnalyticsTokenSymbols(account, ethDefinitions)).toEqual(['ETH']);
    });

    it('omits the native token when the native balance is zero', () => {
        const account = mockWalletAccount({
            symbol: ethSymbol,
            balance: '0',
            tokens: [mockAccountToken({ symbol: 'USDC', contract: legitContract, balance: '100' })],
        });

        expect(getAccountAnalyticsTokenSymbols(account, ethDefinitions)).toEqual(['USDC']);
    });

    it('includes only legit tokens with balance, native first', () => {
        const account = mockWalletAccount({
            symbol: ethSymbol,
            balance: '1000',
            tokens: [
                mockAccountToken({ symbol: 'USDC', contract: legitContract, balance: '100' }),
                mockAccountToken({ symbol: 'SPAM', contract: spamContract, balance: '100' }),
                mockAccountToken({ symbol: 'HIDDEN', contract: hiddenContract, balance: '100' }),
                mockAccountToken({ symbol: 'ZERO', contract: zeroBalanceContract, balance: '0' }),
            ],
        });

        expect(getAccountAnalyticsTokenSymbols(account, ethDefinitions)).toEqual(['ETH', 'USDC']);
    });

    it('deduplicates repeated token symbols', () => {
        const otherLegitContract = '0x' + 'd'.repeat(40);
        const definitions: TokenDefinition = {
            error: false,
            isLoading: false,
            data: [legitContract, otherLegitContract],
            hide: [],
            show: [],
        };
        const account = mockWalletAccount({
            symbol: ethSymbol,
            balance: '0',
            tokens: [
                mockAccountToken({ symbol: 'USDC', contract: legitContract, balance: '100' }),
                mockAccountToken({ symbol: 'USDC', contract: otherLegitContract, balance: '50' }),
            ],
        });

        expect(getAccountAnalyticsTokenSymbols(account, definitions)).toEqual(['USDC']);
    });

    it('omits definition-dependent tokens until token definitions are loaded', () => {
        const account = mockWalletAccount({
            symbol: ethSymbol,
            balance: '1000',
            tokens: [mockAccountToken({ symbol: 'USDC', contract: legitContract, balance: '100' })],
        });

        expect(getAccountAnalyticsTokenSymbols(account, undefined)).toEqual(['ETH']);
    });
});
