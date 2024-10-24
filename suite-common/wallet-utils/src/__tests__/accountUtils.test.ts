import { Account } from '@suite-common/wallet-types';
import { testMocks } from '@suite-common/test-utils';

import {
    accountSearchFn,
    findAccountDevice,
    formatNetworkAmount,
    getAccountIdentifier,
    getAccountKey,
    getBip43Type,
    substituteBip43Path,
    getFiatValue,
    getFirstFreshAddress,
    getTitleForNetwork,
    getTitleForCoinjoinAccount,
    getUtxoFromSignedTransaction,
    getNetworkAccountFeatures,
    hasNetworkFeatures,
    isTestnet,
    networkAmountToSatoshi,
    parseBIP44Path,
    sortByCoin,
    getUtxoOutpoint,
    readUtxoOutpoint,
    sortByBIP44AddressIndex,
    enhanceAddresses,
} from '../accountUtils';
import * as fixtures from '../__fixtures__/accountUtils';

const { getSuiteDevice, getWalletAccount } = testMocks;

describe('account utils', () => {
    fixtures.getFirstFreshAddress.forEach(f => {
        it(`getFirstFreshAddress: ${f.description}`, () => {
            const { account, receive, pendingAddresses, utxoBasedAccount } = f.params;
            const freshAddress = getFirstFreshAddress(
                // @ts-expect-error params are partial
                account,
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

    describe('get title for network', () => {
        fixtures.accountTitleFixture.forEach((fixture: any) => {
            it(fixture.symbol, () => {
                expect(getTitleForNetwork(fixture.symbol)).toBe(fixture.title);
            });
        });
    });

    describe('get title for coinjoin accounts', () => {
        fixtures.accountTitleCoinjoinFixture.forEach((fixture: any) => {
            it(fixture.symbol, () => {
                expect(getTitleForCoinjoinAccount(fixture.symbol)).toBe(fixture.title);
            });
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
        it("substitutes 'i' placeholder in path with index", () => {
            expect(substituteBip43Path("m/84'/0'/i'", 7)).toEqual("m/84'/0'/7'");
            expect(substituteBip43Path("m/44'/0'/i'/0", '4')).toEqual("m/44'/0'/4'/0");
            expect(substituteBip43Path("m/10025'/1'/i'/1'")).toEqual("m/10025'/1'/0'/1'");
        });
    });

    it('get fiat value', () => {
        expect(getFiatValue('1', '10')).toEqual('10.00');
        expect(getFiatValue('1', '10', 5)).toEqual('10.00000');
        expect(getFiatValue('s', '10')).toEqual('');
    });

    it('format network amount', () => {
        expect(formatNetworkAmount('1', 'btc')).toEqual('0.00000001');
        expect(formatNetworkAmount('1', 'xrp')).toEqual('0.000001');
        expect(formatNetworkAmount('1', 'xrp', true)).toEqual('0.000001 XRP');
        expect(formatNetworkAmount('1', 'eth')).toEqual('0.000000000000000001');
        expect(formatNetworkAmount('1', 'btc', true)).toEqual('0.00000001 BTC');
        expect(formatNetworkAmount('1', 'btc', true, true)).toEqual('1 sat');
        expect(formatNetworkAmount('aaa', 'eth')).toEqual('-1');
    });

    it('format amount to satoshi', () => {
        expect(networkAmountToSatoshi('0.00000001', 'btc')).toEqual('1');
        expect(networkAmountToSatoshi('0.000001', 'xrp')).toEqual('1');
        expect(networkAmountToSatoshi('0.000000000000000001', 'eth')).toEqual('1');
        expect(networkAmountToSatoshi('aaa', 'eth')).toEqual('-1');
    });

    it('findAccountDevice', () => {
        expect(
            findAccountDevice(
                getWalletAccount({
                    deviceState: '1stTestnet@device_id:0',
                    descriptor:
                        'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
                    symbol: 'btc',
                }),
                [
                    getSuiteDevice({
                        state: '1stTestnet@device_id:0',
                    }),
                    getSuiteDevice({
                        state: '1stTestnet@device_id:3',
                    }),
                ],
            ),
        ).toEqual(
            getSuiteDevice({
                state: '1stTestnet@device_id:0',
            }),
        );
    });

    it('getAccountKey', () => {
        expect(getAccountKey('descriptor', 'symbol', '1stTestnetAddress@device_id:0')).toEqual(
            'descriptor-symbol-1stTestnetAddress@device_id:0',
        );
    });

    it('isTestnet', () => {
        expect(isTestnet('test')).toEqual(true);
        expect(isTestnet('tsep')).toEqual(true);
        expect(isTestnet('thol')).toEqual(true);
        expect(isTestnet('txrp')).toEqual(true);
        expect(isTestnet('btc')).toEqual(false);
        expect(isTestnet('ltc')).toEqual(false);
    });

    it('getAccountIdentifier', () => {
        expect(
            getAccountIdentifier(
                getWalletAccount({
                    deviceState: '1stTestnet@device_id:0',
                    descriptor:
                        'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
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
        const btcAcc = getWalletAccount({
            deviceState: '1stTestnet@device_id:0',
            descriptor:
                'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
            symbol: 'btc',
            accountType: 'legacy',
            metadata: {
                key: 'xpub-foo-bar',
                1: {
                    fileName: '123',
                    aesKey: 'foo',
                },
            },
            accountLabel: 'meow',
        });

        expect(accountSearchFn(btcAcc, 'btc')).toBe(true);
        expect(accountSearchFn(btcAcc, '', 'btc')).toBe(true);
        expect(
            accountSearchFn(
                btcAcc,
                'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
                'btc',
            ),
        ).toBe(true);
        expect(accountSearchFn(btcAcc, '', 'ltc')).toBe(false);
        expect(accountSearchFn(btcAcc, 'bitcoin')).toBe(true);
        expect(accountSearchFn(btcAcc, 'legacy')).toBe(true);
        expect(accountSearchFn(btcAcc, 'bitco')).toBe(true);
        expect(accountSearchFn(btcAcc, 'ltc')).toBe(false);
        expect(accountSearchFn(btcAcc, 'litecoin')).toBe(false);
        expect(accountSearchFn(btcAcc, 'meow')).toBe(true);
        expect(accountSearchFn(btcAcc, 'wuff', undefined, 'wuff')).toBe(true);
        expect(accountSearchFn(btcAcc, 'meo')).toBe(true);
        expect(accountSearchFn(btcAcc, 'eow')).toBe(true);
        expect(accountSearchFn(btcAcc, 'MEOW')).toBe(true);
        expect(accountSearchFn(btcAcc, 'wuff')).toBe(false);
        expect(
            accountSearchFn(
                btcAcc,
                'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
            ),
        ).toBe(true);
    });

    it('getNetworkAccountFeatures', () => {
        const btcAcc = getWalletAccount({ symbol: 'btc' });
        const btcTaprootAcc = getWalletAccount({ symbol: 'btc', accountType: 'taproot' });
        const btcLegacy = getWalletAccount({ symbol: 'btc', accountType: 'legacy' });
        const ethAcc = getWalletAccount();
        const coinjoinAcc = getWalletAccount({ symbol: 'regtest', accountType: 'coinjoin' });

        expect(getNetworkAccountFeatures(btcAcc)).toEqual(['rbf', 'sign-verify', 'amount-unit']);
        expect(getNetworkAccountFeatures(btcTaprootAcc)).toEqual(['rbf', 'amount-unit']);
        expect(getNetworkAccountFeatures(ethAcc)).toEqual([
            'rbf',
            'sign-verify',
            'tokens',
            'coin-definitions',
            'nft-definitions',
            'staking',
        ]);
        expect(getNetworkAccountFeatures(coinjoinAcc)).toEqual(['rbf', 'amount-unit']);
        // when account does not have features defined, take them from root network object
        expect(getNetworkAccountFeatures(btcLegacy)).toEqual(getNetworkAccountFeatures(btcAcc));
    });

    it('hasNetworkFeatures', () => {
        const btcAcc = getWalletAccount({
            networkType: 'bitcoin',
            symbol: 'btc',
        });

        const ethAcc = getWalletAccount();

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
