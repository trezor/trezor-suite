import { Account } from '@suite-common/wallet-types';
import { testMocks } from '@suite-common/test-utils';

import {
    accountSearchFn,
    findAccountDevice,
    formatNetworkAmount,
    getAccountIdentifier,
    getAccountKey,
    getBip43Type,
    getFiatValue,
    getFirstFreshAddress,
    getNetwork,
    getTitleForNetwork,
    getTitleForCoinjoinAccount,
    getUtxoFromSignedTransaction,
    getNetworkFeatures,
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
                    deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
                    descriptor:
                        'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
                    symbol: 'btc',
                }),
                [
                    getSuiteDevice({
                        state: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
                    }),
                    getSuiteDevice({
                        state: '20f91883604899768ba21ffd38d0f5f35b07f14e65355f342e4442547c0ce45e',
                    }),
                ],
            ),
        ).toEqual(
            getSuiteDevice({
                state: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
            }),
        );
    });

    it('getSelectedNetwork', () => {
        const res = getNetwork('btc');
        if (res) {
            expect(res.name).toEqual('Bitcoin');
        } else {
            expect(res).toBeNull();
        }
        expect(getNetwork('doesntexist')).toBeNull();
    });

    it('getAccountKey', () => {
        expect(getAccountKey('descriptor', 'symbol', 'deviceState')).toEqual(
            'descriptor-symbol-deviceState',
        );
    });

    it('isTestnet', () => {
        expect(isTestnet('test')).toEqual(true);
        expect(isTestnet('tsep')).toEqual(true);
        expect(isTestnet('tgor')).toEqual(true);
        expect(isTestnet('thol')).toEqual(true);
        expect(isTestnet('txrp')).toEqual(true);
        expect(isTestnet('btc')).toEqual(false);
        expect(isTestnet('ltc')).toEqual(false);
    });

    it('getAccountIdentifier', () => {
        expect(
            getAccountIdentifier(
                getWalletAccount({
                    deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
                    descriptor:
                        'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
                    symbol: 'btc',
                }),
            ),
        ).toEqual({
            descriptor:
                'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
            symbol: 'btc',
            deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
        });
    });

    it('accountSearchFn', () => {
        const btcAcc = getWalletAccount({
            deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
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

    it('getNetworkFeatures', () => {
        const btcAcc = getWalletAccount({
            networkType: 'bitcoin',
            symbol: 'btc',
        });

        const btcTaprootAcc = getWalletAccount({
            networkType: 'bitcoin',
            symbol: 'btc',
            accountType: 'taproot',
        });

        const ethAcc = getWalletAccount();

        const coinjoinAcc = getWalletAccount({
            networkType: 'bitcoin',
            symbol: 'regtest',
            accountType: 'coinjoin',
        });

        expect(getNetworkFeatures(btcAcc)).toEqual(['rbf', 'sign-verify', 'amount-unit']);
        expect(getNetworkFeatures(btcTaprootAcc)).toEqual(['rbf', 'amount-unit']);
        expect(getNetworkFeatures(ethAcc)).toEqual([
            'rbf',
            'sign-verify',
            'tokens',
            'token-definitions',
        ]);
        expect(getNetworkFeatures(coinjoinAcc)).toEqual(['rbf', 'amount-unit']);
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
