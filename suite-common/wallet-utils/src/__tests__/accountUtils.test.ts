import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { type NetworkFeature } from '@suite-common/wallet-config';
import { type Account, asAccountDescriptor, createAccountKey } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import * as fixtures from '../__fixtures__/accountUtils';
import {
    accountSearchFn,
    enhanceAddresses,
    findAccountDevice,
    getAccountIdentifier,
    getBip43Type,
    getFirstFreshAddress,
    getNetworkAccountFeatures,
    getUtxoFromSignedTransaction,
    getUtxoOutpoint,
    hasNetworkFeatures,
    isTestnet,
    parseBIP44Path,
    readUtxoOutpoint,
    sortByBIP44AddressIndex,
    sortByCoin,
    substituteBip43Path,
} from '../accountUtils';
import {
    convertAmountSubunitsToUnits,
    convertAmountUnitsToSubunits,
    formatNetworkAmount,
    networkAmountToSmallestUnit,
} from '../amountUtils';

describe('account utils', () => {
    fixtures.getFirstFreshAddress.forEach(f => {
        it(`getFirstFreshAddress: ${f.description}`, () => {
            const { account, receive, pendingAddresses, utxoBasedAccount } = f.params;
            const freshAddress = getFirstFreshAddress(
                account as Account,
                receive,
                pendingAddresses,
                utxoBasedAccount,
            );
            expect(freshAddress).toMatchObject(f.result);
        });
    });

    fixtures.getUtxoFromSignedTransaction.forEach(f => {
        it(`getUtxoFromSignedTransaction: ${f.description}`, () => {
            // @ts-expect-error params are partial
            expect(getUtxoFromSignedTransaction(f.params)).toMatchObject(f.result);
        });
    });

    fixtures.parseBIP44Path.forEach(f => {
        it('accountUtils.parseBIP44Path', () => {
            expect(parseBIP44Path(f.path)).toEqual(f.result);
        });
    });

    fixtures.sortByCoin.forEach(f => {
        it('accountUtils.sortByCoin', () => {
            expect(sortByCoin(f.accounts as Account[])).toEqual(f.result);
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
        expect(formatNetworkAmount('1', 'btc')).toEqual('0.00000001');
        expect(formatNetworkAmount('1', 'xrp')).toEqual('0.000001');
        expect(formatNetworkAmount('1', 'xrp', true)).toEqual('0.000001 XRP');
        expect(formatNetworkAmount('1', 'eth')).toEqual('0.000000000000000001');
        expect(formatNetworkAmount('1', 'btc', true)).toEqual('0.00000001 BTC');
        expect(formatNetworkAmount('1', 'btc', true, true)).toEqual('1 sat BTC');
        expect(formatNetworkAmount('', 'btc')).toEqual('0');
        expect(formatNetworkAmount('', 'btc', true)).toEqual('0 BTC');
        expect(formatNetworkAmount('', 'btc', true, true)).toEqual('0 sat BTC');
        expect(() => formatNetworkAmount('aaa', 'eth')).toThrow();
    });

    it('format amount to satoshi', () => {
        expect(networkAmountToSmallestUnit('0.00000001', 'btc')).toEqual('1');
        expect(networkAmountToSmallestUnit('0.000001', 'xrp')).toEqual('1');
        expect(networkAmountToSmallestUnit('0.000000000000000001', 'eth')).toEqual('1');
        expect(networkAmountToSmallestUnit('aaa', 'eth')).toEqual('-1');
    });

    it('findAccountDevice', () => {
        expect(
            findAccountDevice(
                mockWalletAccount({
                    deviceState: '1stTestnet@device_id:0',
                    descriptor: asAccountDescriptor(
                        'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
                    ),
                    symbol: 'btc',
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

    it('getAccountKey', () => {
        expect(
            createAccountKey({
                accountDescriptor: asAccountDescriptor('descriptor'),
                networkSymbol: 'btc',
                deviceStaticSessionId: '1stTestnetAddress@device_id:0',
            }),
        ).toEqual('descriptor-btc-1stTestnetAddress@device_id:0');
    });

    it('isTestnet', () => {
        expect(isTestnet('test')).toEqual(true);
        expect(isTestnet('tsep')).toEqual(true);
        expect(isTestnet('thod')).toEqual(true);
        expect(isTestnet('txrp')).toEqual(true);
        expect(isTestnet('txlm')).toEqual(true);
        expect(isTestnet('btc')).toEqual(false);
        expect(isTestnet('ltc')).toEqual(false);
        expect(isTestnet('xlm')).toEqual(false);
    });

    it('getAccountIdentifier', () => {
        expect(
            getAccountIdentifier(
                mockWalletAccount({
                    deviceState: '1stTestnet@device_id:0',
                    descriptor: asAccountDescriptor(
                        'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
                    ),
                    symbol: 'btc',
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
            symbol: 'btc',
            accountType: 'legacy',
            metadata: {
                key: 'xpub-foo-bar',
                1: {
                    fileName: '123',
                    aesKey: 'foo',
                },
            },
        });

        expect(accountSearchFn(btcAcc, 'btc', { accountLabel: '' })).toBe(true);
        expect(accountSearchFn(btcAcc, '', { coinsFilter: 'btc', accountLabel: '' })).toBe(true);
        expect(
            accountSearchFn(
                btcAcc,
                'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
                { coinsFilter: 'btc', accountLabel: '' },
            ),
        ).toBe(true);
        expect(accountSearchFn(btcAcc, '', { coinsFilter: 'ltc', accountLabel: '' })).toBe(false);
        expect(accountSearchFn(btcAcc, 'bitcoin', { accountLabel: '' })).toBe(true);
        expect(accountSearchFn(btcAcc, 'legacy', { accountLabel: '' })).toBe(true);
        expect(accountSearchFn(btcAcc, 'bitco', { accountLabel: '' })).toBe(true);
        expect(accountSearchFn(btcAcc, 'ltc', { accountLabel: '' })).toBe(false);
        expect(accountSearchFn(btcAcc, 'litecoin', { accountLabel: '' })).toBe(false);
        expect(accountSearchFn(btcAcc, 'meow', { accountLabel: 'meow' })).toBe(true);
        expect(
            accountSearchFn(btcAcc, 'wuff', {
                accountLabel: 'wuff',
            }),
        ).toBe(true);
        expect(accountSearchFn(btcAcc, 'meo', { accountLabel: 'meow' })).toBe(true);
        expect(accountSearchFn(btcAcc, 'eow', { accountLabel: 'meow' })).toBe(true);
        expect(accountSearchFn(btcAcc, 'MEOW', { accountLabel: 'meow' })).toBe(true);
        expect(accountSearchFn(btcAcc, 'wuff', { accountLabel: '' })).toBe(false);
        expect(
            accountSearchFn(
                btcAcc,
                'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
                { accountLabel: '' },
            ),
        ).toBe(true);
        expect(accountSearchFn(btcAcc, '#1', { accountLabel: 'Bitcoin #1' })).toBe(true);
    });

    it('getNetworkAccountFeatures', () => {
        const btcAcc = mockWalletAccount({ symbol: 'btc' });
        const btcTaprootAcc = mockWalletAccount({ symbol: 'btc', accountType: 'taproot' });
        const btcLegacy = mockWalletAccount({ symbol: 'btc', accountType: 'legacy' });
        const ethAcc = mockWalletAccount({ symbol: 'eth' });
        const coinjoinAcc = mockWalletAccount({ symbol: 'regtest', accountType: 'coinjoin' });

        expect(getNetworkAccountFeatures(btcAcc)).toEqual([
            'rbf',
            'sign-verify',
            'amount-unit',
            'graph',
        ] satisfies NetworkFeature[]);
        expect(getNetworkAccountFeatures(btcTaprootAcc)).toEqual(['rbf', 'amount-unit']);
        expect(getNetworkAccountFeatures(ethAcc)).toEqual([
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
        expect(getNetworkAccountFeatures(coinjoinAcc)).toEqual(['rbf', 'amount-unit']);
        // when account does not have features defined, take them from root network object
        expect(getNetworkAccountFeatures(btcLegacy)).toEqual(getNetworkAccountFeatures(btcAcc));
    });

    it('hasNetworkFeatures', () => {
        const btcAcc = mockWalletAccount({ symbol: 'btc' });

        const ethAcc = mockWalletAccount({ symbol: 'eth' });

        expect(hasNetworkFeatures(btcAcc, 'amount-unit')).toEqual(true);
        expect(hasNetworkFeatures(btcAcc, ['amount-unit', 'sign-verify'])).toEqual(true);
        expect(hasNetworkFeatures(ethAcc, 'tokens')).toEqual(true);
        expect(hasNetworkFeatures(ethAcc, 'amount-unit')).toEqual(false);
        expect(hasNetworkFeatures(ethAcc, ['amount-unit', 'sign-verify'])).toEqual(false);
        expect(hasNetworkFeatures(ethAcc, ['tokens', 'rbf'])).toEqual(true);
    });

    it('getUtxoOutpoint/readUtxoOutpoint', () => {
        expect(
            getUtxoOutpoint({
                txid: '0dac366fd8a67b2a89fbb0d31086e7acded7a5bbf9ef9daa935bc873229ef5b5',
                vout: 1,
            }),
        ).toEqual('b5f59e2273c85b93aa9deff9bba5d7deace78610d3b0fb892a7ba6d86f36ac0d01000000');
        expect(
            readUtxoOutpoint(
                'b5f59e2273c85b93aa9deff9bba5d7deace78610d3b0fb892a7ba6d86f36ac0d01000000',
            ),
        ).toEqual({
            txid: '0dac366fd8a67b2a89fbb0d31086e7acded7a5bbf9ef9daa935bc873229ef5b5',
            vout: 1,
        });
    });

    it('sortByBIP44AddressIndex', () => {
        const path = 'm/1234';
        const [a, b, c, d, e, f] = ['a', 'b', 'c', 'd', 'e', 'f'].map((address, i) => ({
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
