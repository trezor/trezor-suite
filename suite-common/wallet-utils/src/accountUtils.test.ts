import { mockNetworkConfigDeps } from '@suite-common/networks/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { type NetworkFeature, asNetworkSymbol } from '@suite-common/wallet-config';
import { mockGetSupportedNetworks } from '@suite-common/wallet-config/mocks';
import {
    type Account,
    type WalletAccountTransaction,
    asAccountDescriptor,
    createAccountKey,
} from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';

import * as fixtures from './__fixtures__/accountUtils';
import {
    accountSearchFn,
    enhanceAddresses,
    findAccountDevice,
    findAccountsByAddress,
    findTransactionSenderAccount,
    getAccountIdentifier,
    getBip43Type,
    getNetworkAccountFeatures,
    getUtxoFromSignedTransaction,
    getUtxoOutpoint,
    hasNetworkFeatures,
    isTestnet,
    sortByBIP44AddressIndex,
    sortByCoin,
    substituteBip43Path,
} from './accountUtils';
import {
    convertAmountSubunitsToUnits,
    convertAmountUnitsToSubunits,
    formatNetworkAmount,
    networkAmountToSmallestUnit,
} from './amountUtils';

const networkConfigDeps = mockNetworkConfigDeps();

const supportedNetworks = mockGetSupportedNetworks();

const btcSymbol = asNetworkSymbol('btc');
const xrpSymbol = asNetworkSymbol('xrp');
const ethSymbol = asNetworkSymbol('eth');
const ltcSymbol = asNetworkSymbol('ltc');

describe('account utils', () => {
    fixtures.getUtxoFromSignedTransaction.forEach(f => {
        it(`getUtxoFromSignedTransaction: ${f.description}`, () => {
            // @ts-expect-error params are partial
            expect(getUtxoFromSignedTransaction(f.params)).toMatchObject(f.result);
        });
    });

    fixtures.sortByCoin.forEach(f => {
        it('accountUtils.sortByCoin', () => {
            const input = [...(f.accounts as Account[])];

            expect(sortByCoin(networkConfigDeps, input, supportedNetworks)).toEqual(f.result);
            // The input array is not mutated.
            expect(input).toEqual(f.accounts);
        });
    });

    describe('getBip43Type', () => {
        fixtures.getBip43Type.forEach(f => {
            it(f.description, () => {
                // @ts-expect-error intentional invalid params
                const bip43 = getBip43Type(f.path);
                expect(bip43).toBe(f.result);
            });
        });
    });

    describe(substituteBip43Path.name, () => {
        fixtures.substituteBip43Path.forEach(f => {
            it(f.description, () => {
                expect(substituteBip43Path(f.pathTemplate, f.index)).toBe(f.result);
            });
        });
    });

    it('format network amount', () => {
        expect(formatNetworkAmount(networkConfigDeps, '1', btcSymbol)).toEqual('0.00000001');
        expect(formatNetworkAmount(networkConfigDeps, '1', xrpSymbol)).toEqual('0.000001');
        expect(formatNetworkAmount(networkConfigDeps, '1', xrpSymbol, true)).toEqual(
            '0.000001 XRP',
        );
        expect(formatNetworkAmount(networkConfigDeps, '1', ethSymbol)).toEqual(
            '0.000000000000000001',
        );
        expect(formatNetworkAmount(networkConfigDeps, '1', btcSymbol, true)).toEqual(
            '0.00000001 BTC',
        );
        expect(formatNetworkAmount(networkConfigDeps, '1', btcSymbol, true, true)).toEqual(
            '1 sat BTC',
        );
        expect(formatNetworkAmount(networkConfigDeps, '', btcSymbol)).toEqual('0');
        expect(formatNetworkAmount(networkConfigDeps, '', btcSymbol, true)).toEqual('0 BTC');
        expect(formatNetworkAmount(networkConfigDeps, '', btcSymbol, true, true)).toEqual(
            '0 sat BTC',
        );
        expect(() => formatNetworkAmount(networkConfigDeps, 'aaa', ethSymbol)).toThrow();
    });

    it('format amount to satoshi', () => {
        expect(networkAmountToSmallestUnit(networkConfigDeps, '0.00000001', btcSymbol)).toEqual(
            '1',
        );
        expect(networkAmountToSmallestUnit(networkConfigDeps, '0.000001', xrpSymbol)).toEqual('1');
        expect(
            networkAmountToSmallestUnit(networkConfigDeps, '0.000000000000000001', ethSymbol),
        ).toEqual('1');
        expect(networkAmountToSmallestUnit(networkConfigDeps, 'aaa', ethSymbol)).toEqual('-1');
    });

    it('findAccountDevice', () => {
        expect(
            findAccountDevice(
                mockWalletAccount({
                    deviceState: '1stTestnet@device_id:0',
                    descriptor: asAccountDescriptor(
                        'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
                    ),
                    symbol: btcSymbol,
                }),
                [
                    mockSuiteDevice({
                        state: { staticSessionId: '1stTestnet@device_id:0' },
                    }),
                    mockSuiteDevice({
                        state: { staticSessionId: '1stTestnet@device_id:3' },
                    }),
                ],
            ),
        ).toEqual(
            mockSuiteDevice({
                state: { staticSessionId: '1stTestnet@device_id:0' },
            }),
        );
    });

    it('findAccountsByAddress matches an ethereum-style account by descriptor equality', () => {
        // Ethereum-style accounts have no `addresses` (used/unused/change) list,
        // so matching must fall back to comparing the address against the descriptor.
        const account = mockWalletAccount({
            symbol: ethSymbol,
            descriptor: asAccountDescriptor('0xAccountAddress'),
        });

        expect(findAccountsByAddress(ethSymbol, '0xAccountAddress', [account])).toEqual([account]);
        expect(findAccountsByAddress(ethSymbol, '0xOtherAddress', [account])).toEqual([]);
    });

    describe('findTransactionSenderAccount', () => {
        const senderAccount = mockWalletAccount({
            symbol: ethSymbol,
            descriptor: asAccountDescriptor('0xSender'),
        });
        const otherAccount = mockWalletAccount({
            symbol: ethSymbol,
            descriptor: asAccountDescriptor('0xOther'),
        });
        const accounts = [senderAccount, otherAccount];

        const mockTx = (vin: Array<{ addresses?: string[] }>) =>
            ({ symbol: ethSymbol, details: { vin } }) as unknown as Pick<
                WalletAccountTransaction,
                'details' | 'symbol'
            >;

        it('resolves the account owning the input address', () => {
            expect(
                findTransactionSenderAccount(mockTx([{ addresses: ['0xSender'] }]), accounts),
            ).toBe(senderAccount);
        });

        it('resolves the account owning every input of a multi-input transaction', () => {
            const tx = mockTx([{ addresses: ['0xSender'] }, { addresses: ['0xSender'] }]);
            expect(findTransactionSenderAccount(tx, accounts)).toBe(senderAccount);
        });

        it('returns undefined for an unknown sender', () => {
            expect(
                findTransactionSenderAccount(mockTx([{ addresses: ['0xExternal'] }]), accounts),
            ).toBeUndefined();
        });

        it('returns undefined when inputs belong to different known accounts', () => {
            const tx = mockTx([{ addresses: ['0xSender'] }, { addresses: ['0xOther'] }]);
            expect(findTransactionSenderAccount(tx, accounts)).toBeUndefined();
        });

        it('returns undefined when any input is unknown (multi-party transaction)', () => {
            const tx = mockTx([{ addresses: ['0xSender'] }, { addresses: ['0xExternal'] }]);
            expect(findTransactionSenderAccount(tx, accounts)).toBeUndefined();
        });

        it('returns undefined when an input has no addresses', () => {
            const tx = mockTx([{ addresses: ['0xSender'] }, {}]);
            expect(findTransactionSenderAccount(tx, accounts)).toBeUndefined();
        });

        it('returns undefined without inputs', () => {
            expect(findTransactionSenderAccount(mockTx([]), accounts)).toBeUndefined();
        });
    });

    it('getAccountKey', () => {
        expect(
            createAccountKey({
                accountDescriptor: asAccountDescriptor('descriptor'),
                networkSymbol: btcSymbol,
                deviceStaticSessionId: '1stTestnetAddress@device_id:0',
            }),
        ).toEqual('descriptor-btc-1stTestnetAddress@device_id:0');
    });

    it('createAccountKey throws when accountDescriptor contains "-"', () => {
        expect(() =>
            createAccountKey({
                accountDescriptor: asAccountDescriptor('btc-with-hyphen'),
                networkSymbol: btcSymbol,
                deviceStaticSessionId: '1stTestnetAddress@device_id:0',
            }),
        ).toThrow(/accountDescriptor must not contain '-'/);
    });

    it('createAccountKey throws when networkSymbol contains "-"', () => {
        expect(() =>
            createAccountKey({
                accountDescriptor: asAccountDescriptor('descriptor'),
                networkSymbol: asNetworkSymbol('btc-bogus'),
                deviceStaticSessionId: '1stTestnetAddress@device_id:0',
            }),
        ).toThrow(/networkSymbol must not contain '-'/);
    });

    it('createAccountKey throws when deviceStaticSessionId contains "-"', () => {
        expect(() =>
            createAccountKey({
                accountDescriptor: asAccountDescriptor('descriptor'),
                networkSymbol: btcSymbol,
                deviceStaticSessionId: 'session-with-hyphen@device:0',
            }),
        ).toThrow(/deviceStaticSessionId must not contain '-'/);
    });

    it('isTestnet', () => {
        expect(isTestnet(networkConfigDeps, asNetworkSymbol('test'))).toEqual(true);
        expect(isTestnet(networkConfigDeps, asNetworkSymbol('tsep'))).toEqual(true);
        expect(isTestnet(networkConfigDeps, asNetworkSymbol('thod'))).toEqual(true);
        expect(isTestnet(networkConfigDeps, asNetworkSymbol('txrp'))).toEqual(true);
        expect(isTestnet(networkConfigDeps, asNetworkSymbol('txlm'))).toEqual(true);
        expect(isTestnet(networkConfigDeps, btcSymbol)).toEqual(false);
        expect(isTestnet(networkConfigDeps, ltcSymbol)).toEqual(false);
        expect(isTestnet(networkConfigDeps, asNetworkSymbol('xlm'))).toEqual(false);
    });

    it('getAccountIdentifier', () => {
        expect(
            getAccountIdentifier(
                mockWalletAccount({
                    deviceState: '1stTestnet@device_id:0',
                    descriptor: asAccountDescriptor(
                        'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
                    ),
                    symbol: btcSymbol,
                }),
            ),
        ).toEqual({
            descriptor:
                'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
            symbol: 'btc',
            deviceState: '1stTestnet@device_id:0',
        });
    });

    it('accountSearchFn', () => {
        const btcAcc = mockWalletAccount({
            deviceState: '1stTestnet@device_id:0',
            descriptor: asAccountDescriptor(
                'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
            ),
            symbol: btcSymbol,
            accountType: 'legacy',
            metadata: {
                key: 'xpub-foo-bar',
                1: {
                    fileName: '123',
                    aesKey: 'foo',
                },
            },
        });

        expect(accountSearchFn(networkConfigDeps, btcAcc, 'btc', { accountLabel: '' })).toBe(true);
        expect(
            accountSearchFn(networkConfigDeps, btcAcc, '', {
                coinsFilter: btcSymbol,
                accountLabel: '',
            }),
        ).toBe(true);
        expect(
            accountSearchFn(
                networkConfigDeps,
                btcAcc,
                'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
                { coinsFilter: btcSymbol, accountLabel: '' },
            ),
        ).toBe(true);
        expect(
            accountSearchFn(networkConfigDeps, btcAcc, '', {
                coinsFilter: ltcSymbol,
                accountLabel: '',
            }),
        ).toBe(false);
        expect(accountSearchFn(networkConfigDeps, btcAcc, 'bitcoin', { accountLabel: '' })).toBe(
            true,
        );
        expect(accountSearchFn(networkConfigDeps, btcAcc, 'legacy', { accountLabel: '' })).toBe(
            true,
        );
        expect(accountSearchFn(networkConfigDeps, btcAcc, 'bitco', { accountLabel: '' })).toBe(
            true,
        );
        expect(accountSearchFn(networkConfigDeps, btcAcc, 'ltc', { accountLabel: '' })).toBe(false);
        expect(accountSearchFn(networkConfigDeps, btcAcc, 'litecoin', { accountLabel: '' })).toBe(
            false,
        );
        expect(accountSearchFn(networkConfigDeps, btcAcc, 'meow', { accountLabel: 'meow' })).toBe(
            true,
        );
        expect(
            accountSearchFn(networkConfigDeps, btcAcc, 'wuff', {
                accountLabel: 'wuff',
            }),
        ).toBe(true);
        expect(accountSearchFn(networkConfigDeps, btcAcc, 'meo', { accountLabel: 'meow' })).toBe(
            true,
        );
        expect(accountSearchFn(networkConfigDeps, btcAcc, 'eow', { accountLabel: 'meow' })).toBe(
            true,
        );
        expect(accountSearchFn(networkConfigDeps, btcAcc, 'MEOW', { accountLabel: 'meow' })).toBe(
            true,
        );
        expect(accountSearchFn(networkConfigDeps, btcAcc, 'wuff', { accountLabel: '' })).toBe(
            false,
        );
        expect(
            accountSearchFn(
                networkConfigDeps,
                btcAcc,
                'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
                { accountLabel: '' },
            ),
        ).toBe(true);
        expect(
            accountSearchFn(networkConfigDeps, btcAcc, '#1', { accountLabel: 'Bitcoin #1' }),
        ).toBe(true);
    });

    it('accountSearchFn matches displayed account type name', () => {
        const segwitAcc = mockWalletAccount({
            symbol: btcSymbol,
            accountType: 'segwit',
        });

        // Matched only via the displayed name, the raw account type key alone would not match.
        expect(
            accountSearchFn(networkConfigDeps, segwitAcc, 'legacy segwit', {
                accountLabel: '',
                accountTypeName: 'Legacy SegWit',
            }),
        ).toBe(true);
        expect(
            accountSearchFn(networkConfigDeps, segwitAcc, 'legacy', {
                accountLabel: '',
                accountTypeName: 'Legacy SegWit',
            }),
        ).toBe(true);
        expect(
            accountSearchFn(networkConfigDeps, segwitAcc, 'LEGACY SEGWIT', {
                accountLabel: '',
                accountTypeName: 'Legacy SegWit',
            }),
        ).toBe(true);
        expect(
            accountSearchFn(networkConfigDeps, segwitAcc, 'legacy segwit', { accountLabel: '' }),
        ).toBe(false);
        expect(
            accountSearchFn(networkConfigDeps, segwitAcc, 'taproot', {
                accountLabel: '',
                accountTypeName: 'Legacy SegWit',
            }),
        ).toBe(false);
    });

    it('accountSearchFn empty tokens', () => {
        const ethAcc = mockWalletAccount({
            symbol: ethSymbol,
            tokens: [
                mockAccountToken({ balance: '0.000069', name: 'test' }),
                mockAccountToken({ balance: '0.0', name: 'test2' }),
            ],
        });

        expect(accountSearchFn(networkConfigDeps, ethAcc, 'test', { accountLabel: '' })).toBe(true);
        expect(accountSearchFn(networkConfigDeps, ethAcc, 'test2', { accountLabel: '' })).toBe(
            false,
        );
    });

    it('accountSearchFn empty tokens pepe-like', () => {
        const ethAcc = mockWalletAccount({
            symbol: ethSymbol,
            tokens: [
                mockAccountToken({ balance: '0.000069', name: 'test' }),
                mockAccountToken({ balance: '0.0', name: 'pepe' }),
            ],
        });

        expect(accountSearchFn(networkConfigDeps, ethAcc, 'test', { accountLabel: '' })).toBe(true);
        expect(accountSearchFn(networkConfigDeps, ethAcc, 'pepe', { accountLabel: '' })).toBe(
            false,
        );
    });

    it('accountSearchFn hidden tokens excluded via searchableTokens', () => {
        const shownToken = mockAccountToken({ balance: '0.000069', name: 'shown' });
        const hiddenToken = mockAccountToken({ balance: '1.0', name: 'hidden-spam' });
        const ethAcc = mockWalletAccount({
            symbol: ethSymbol,
            tokens: [shownToken, hiddenToken],
        });

        expect(
            accountSearchFn(networkConfigDeps, ethAcc, 'hidden-spam', { accountLabel: '' }),
        ).toBe(true);
        expect(
            accountSearchFn(networkConfigDeps, ethAcc, 'hidden-spam', {
                accountLabel: '',
                searchableTokens: [shownToken],
            }),
        ).toBe(false);
        expect(
            accountSearchFn(networkConfigDeps, ethAcc, 'shown', {
                accountLabel: '',
                searchableTokens: [shownToken],
            }),
        ).toBe(true);
    });

    it('getNetworkAccountFeatures', () => {
        const btcAcc = mockWalletAccount({ symbol: btcSymbol });
        const btcTaprootAcc = mockWalletAccount({
            symbol: btcSymbol,
            accountType: 'taproot',
        });
        const btcLegacy = mockWalletAccount({
            symbol: btcSymbol,
            accountType: 'legacy',
        });
        const ethAcc = mockWalletAccount({ symbol: ethSymbol });
        const coinjoinAcc = mockWalletAccount({
            symbol: asNetworkSymbol('regtest'),
            accountType: 'coinjoin',
        });

        expect(getNetworkAccountFeatures(networkConfigDeps, btcAcc)).toEqual([
            'rbf',
            'sign-verify',
            'amount-unit',
            'graph',
        ] satisfies NetworkFeature[]);
        expect(getNetworkAccountFeatures(networkConfigDeps, btcTaprootAcc)).toEqual([
            'rbf',
            'amount-unit',
        ]);
        expect(getNetworkAccountFeatures(networkConfigDeps, ethAcc)).toEqual([
            'rbf',
            'sign-verify',
            'tokens',
            'nfts',
            'coin-definitions',
            'nft-definitions',
            'staking',
            'eip1559',
            'mev-protection',
            'graph',
            'claim-rewards',
        ]);
        expect(getNetworkAccountFeatures(networkConfigDeps, coinjoinAcc)).toEqual([
            'rbf',
            'amount-unit',
        ]);
        // when account does not have features defined, take them from root network object
        expect(getNetworkAccountFeatures(networkConfigDeps, btcLegacy)).toEqual(
            getNetworkAccountFeatures(networkConfigDeps, btcAcc),
        );
    });

    it('hasNetworkFeatures', () => {
        const btcAcc = mockWalletAccount({ symbol: btcSymbol });

        const ethAcc = mockWalletAccount({ symbol: ethSymbol });

        expect(hasNetworkFeatures(networkConfigDeps, btcAcc, 'amount-unit')).toEqual(true);
        expect(
            hasNetworkFeatures(networkConfigDeps, btcAcc, ['amount-unit', 'sign-verify']),
        ).toEqual(true);
        expect(hasNetworkFeatures(networkConfigDeps, ethAcc, 'tokens')).toEqual(true);
        expect(hasNetworkFeatures(networkConfigDeps, ethAcc, 'amount-unit')).toEqual(false);
        expect(
            hasNetworkFeatures(networkConfigDeps, ethAcc, ['amount-unit', 'sign-verify']),
        ).toEqual(false);
        expect(hasNetworkFeatures(networkConfigDeps, ethAcc, ['tokens', 'rbf'])).toEqual(true);
    });

    it('getUtxoOutpoint', () => {
        expect(
            getUtxoOutpoint({
                txid: '0dac366fd8a67b2a89fbb0d31086e7acded7a5bbf9ef9daa935bc873229ef5b5',
                vout: 1,
            }),
        ).toEqual('b5f59e2273c85b93aa9deff9bba5d7deace78610d3b0fb892a7ba6d86f36ac0d01000000');
    });

    it('sortByBIP44AddressIndex', () => {
        const path = 'm/1234';
        type Entry = { address: string; path: string };
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const [a, b, c, d, e, f]: [Entry, Entry, Entry, Entry, Entry, Entry] = [
            'a',
            'b',
            'c',
            'd',
            'e',
            'f',
        ].map((address, i) => ({
            address,
            path: `${path}/${i}`,
        }));
        expect(sortByBIP44AddressIndex(path, [a, b, c, d, e, f])).toEqual([a, b, c, d, e, f]);
        expect(sortByBIP44AddressIndex(path, [f, e, d, c, b, a])).toEqual([a, b, c, d, e, f]);
        expect(sortByBIP44AddressIndex(path, [e, c, b, a, f, d])).toEqual([a, b, c, d, e, f]);
        expect(sortByBIP44AddressIndex(path, [b, c, a, f, d, e])).toEqual([a, b, c, d, e, f]);
    });

    it('enhanceAddresses: count transfers from pending txs', () => {
        const getAddr = (address: string, transfers: number) => ({ address, transfers });
        const getTx = (blockHeight: number, vinaddr: string, voutaddr: string) => ({
            blockHeight,
            details: {
                vin: [{ addresses: [vinaddr] }],
                vout: [{ addresses: [voutaddr] }],
            },
        });

        const account: any = { networkType: 'bitcoin' };
        const accountInfo: any = {
            addresses: {
                change: [getAddr('A', 1), getAddr('B', 0)],
            },
            history: { transactions: [getTx(1, 'A', 'C'), getTx(1, 'C', 'B')] },
            page: { index: 1 },
        };

        // no pending tx, addresses just copied from accountInfo to account
        account.addresses = enhanceAddresses(accountInfo, account);
        expect(account.addresses.change).toEqual([getAddr('A', 1), getAddr('B', 0)]);

        // pending tx with B, so B has now transfers 1
        accountInfo.history.transactions[1].blockHeight = 0;
        account.addresses = enhanceAddresses(accountInfo, account);
        expect(account.addresses.change).toEqual([getAddr('A', 1), getAddr('B', 1)]);

        // accountInfo with page index <> 1 without txs, preserve addresses and transfers
        accountInfo.page.index = 2;
        accountInfo.history.transactions = [];
        account.addresses = enhanceAddresses(accountInfo, account);
        expect(account.addresses.change).toEqual([getAddr('A', 1), getAddr('B', 1)]);

        // accountInfo with page index 1 without txs, so B has now transfers 0
        accountInfo.page.index = 1;
        account.addresses = enhanceAddresses(accountInfo, account);
        expect(account.addresses.change).toEqual([getAddr('A', 1), getAddr('B', 0)]);

        // no addresses in accountInfo, so no addresses in account
        accountInfo.addresses.change = [];
        account.addresses = enhanceAddresses(accountInfo, account);
        expect(account.addresses.change).toEqual([]);
    });
});

describe(convertAmountUnitsToSubunits.name, () => {
    it('converts BTC->Sats', () => {
        expect(convertAmountUnitsToSubunits('1', 8)).toEqual(String(100_000_000));
    });
});

describe(convertAmountSubunitsToUnits.name, () => {
    it('converts Sats->BTC', () => {
        expect(convertAmountSubunitsToUnits('1', 8)).toEqual('0.00000001');
    });
});
