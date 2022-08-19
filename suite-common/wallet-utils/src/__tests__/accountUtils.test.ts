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
    getNetwork,
    getTitleForNetwork,
    getUtxoFromSignedTransaction,
    hasNetworkFeatures,
    isTestnet,
    networkAmountToSatoshi,
    parseBIP44Path,
    sortByCoin,
} from '../accountUtils';
import * as fixtures from '../__fixtures__/accountUtils';

describe('account utils', () => {
    fixtures.getUtxoFromSignedTransaction.forEach(f => {
        it(`getUtxoFromSignedTransaction: ${f.description}`, () => {
            // @ts-expect-error params are partial
            expect(getUtxoFromSignedTransaction(...f.params)).toMatchObject(f.result);
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
                testMocks.getWalletAccount({
                    deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
                    descriptor:
                        'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
                    symbol: 'btc',
                }),
                [
                    testMocks.getSuiteDevice({
                        state: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
                    }),
                    testMocks.getSuiteDevice({
                        state: '20f91883604899768ba21ffd38d0f5f35b07f14e65355f342e4442547c0ce45e',
                    }),
                ],
            ),
        ).toEqual(
            testMocks.getSuiteDevice({
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

    it('getAccountHash', () => {
        expect(getAccountKey('descriptor', 'symbol', 'deviceState')).toEqual(
            'descriptor-symbol-deviceState',
        );
    });

    it('isTestnet', () => {
        expect(isTestnet('test')).toEqual(true);
        expect(isTestnet('trop')).toEqual(true);
        expect(isTestnet('txrp')).toEqual(true);
        expect(isTestnet('btc')).toEqual(false);
        expect(isTestnet('ltc')).toEqual(false);
    });

    it('getAccountIdentifier', () => {
        expect(
            getAccountIdentifier(
                testMocks.getWalletAccount({
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
        const btcAcc = testMocks.getWalletAccount({
            deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
            descriptor:
                'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
            symbol: 'btc',
            accountType: 'legacy',
            metadata: {
                key: 'xpub-foo-bar',
                fileName: '123',
                aesKey: 'foo',
                accountLabel: 'meow',
                outputLabels: {},
                addressLabels: {},
            },
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

    it('hasNetworkFeatures', () => {
        const btcAcc = testMocks.getWalletAccount({
            networkType: 'bitcoin',
            symbol: 'btc',
        });

        const ethAcc = testMocks.getWalletAccount();

        expect(hasNetworkFeatures(btcAcc, 'amount-unit')).toEqual(true);
        expect(hasNetworkFeatures(btcAcc, ['amount-unit', 'sign-verify'])).toEqual(true);
        expect(hasNetworkFeatures(ethAcc, 'tokens')).toEqual(true);
        expect(hasNetworkFeatures(ethAcc, 'amount-unit')).toEqual(false);
        expect(hasNetworkFeatures(ethAcc, ['amount-unit', 'sign-verify'])).toEqual(false);
    });
});
