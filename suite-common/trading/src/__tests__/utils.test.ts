import type { CryptoId } from 'invity-api';

import { NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import type { Account } from '@suite-common/wallet-types';

import * as BUY_FIXTURE from '../__fixtures__/buyUtils';
import * as EXCHANGE_FIXTURE from '../__fixtures__/exchangeUtils';
import * as SELL_FIXTURE from '../__fixtures__/sellUtils';
import { accountBtc, accountEth } from '../__fixtures__/utils';
import type { TradingAccountOptionsGroupOptionProps } from '../types';
import {
    addIdsToQuotes,
    cryptoIdToSymbol,
    filterQuotesAccordingTags,
    getDefaultCountry,
    getTagAndInfoNote,
    getTradingNetworkDecimals,
    getTradingPaymentMethods,
    getTradingQuotesByPaymentMethod,
    getUnusedAddressFromAccount,
    isCryptoIdForNativeToken,
    mapTestnetSymbol,
    testnetToProdCryptoId,
    toTokenCryptoId,
} from '../utils';

describe('getUnusedAddressFromAccount', () => {
    it('should return unused value from the passed account', () => {
        expect(getUnusedAddressFromAccount(accountBtc as Account)).toStrictEqual({
            address: '177BUDVZqTTzK1Fogqcrfbb5ketHEUDGSJ',
            path: "m/44'/0'/3'/0/0",
        });

        expect(getUnusedAddressFromAccount(accountEth as Account)).toStrictEqual({
            address: '0x2e0DC981d301cdd443C3987cf19Eb9671CB99ddC',
            path: "m/44'/60'/0'/0/1",
        });
    });
});

describe('mapTestnetCryptoCurrency', () => {
    it.each([
        ['btc', 'btc'],
        ['eth', 'eth'],
        ['test', 'btc'],
        ['tsep', 'eth'],
        ['thol', 'eth'],
        ['txrp', 'xrp'],
        ['tada', 'ada'],
    ] as [NetworkSymbol, NetworkSymbol][])(
        'should transform testnet network symbol [%s] to mainnet',
        (symbol, expectedValue) => {
            expect(mapTestnetSymbol(symbol)).toStrictEqual(expectedValue);
        },
    );
});

describe('getTagAndInfoNote', () => {
    it('should return tag and info not from passed data', () => {
        expect(getTagAndInfoNote({})).toStrictEqual({ infoNote: '', tag: '' });
        expect(getTagAndInfoNote({ infoNote: '' })).toStrictEqual({ infoNote: '', tag: '' });
        expect(getTagAndInfoNote({ infoNote: 'Foo' })).toStrictEqual({ infoNote: 'Foo', tag: '' });
        expect(getTagAndInfoNote({ infoNote: ' #Foo' })).toStrictEqual({
            infoNote: '',
            tag: 'Foo',
        });
        expect(getTagAndInfoNote({ infoNote: 'Foo#Bar' })).toStrictEqual({
            infoNote: 'Foo#Bar',
            tag: '',
        });
        expect(getTagAndInfoNote({ infoNote: '#Foo' })).toStrictEqual({ infoNote: '', tag: 'Foo' });
        expect(getTagAndInfoNote({ infoNote: '# Foo' })).toStrictEqual({
            infoNote: '',
            tag: ' Foo',
        });
        expect(getTagAndInfoNote({ infoNote: '##Bar' })).toStrictEqual({
            infoNote: 'Bar',
            tag: '',
        });
        expect(getTagAndInfoNote({ infoNote: '#Foo#Bar' })).toStrictEqual({
            infoNote: 'Bar',
            tag: 'Foo',
        });
        expect(getTagAndInfoNote({ infoNote: '  #Foo#Bar \t' })).toStrictEqual({
            infoNote: 'Bar',
            tag: 'Foo',
        });
    });
});

describe('filterQuotesAccordingTags', () => {
    it('should filter quotes', () => {
        const quotes = [
            ...BUY_FIXTURE.MIN_MAX_QUOTES_OK,
            ...BUY_FIXTURE.ALTERNATIVE_QUOTES,
            ...SELL_FIXTURE.MIN_MAX_QUOTES_HIGH,
        ];

        expect(filterQuotesAccordingTags([])).toStrictEqual([]);
        expect(filterQuotesAccordingTags(quotes).length).toStrictEqual(
            quotes.filter(q => !q.tags || !q.tags.includes('alternativeCurrency')).length,
        );
    });
});

describe('addIdsToQuotes', () => {
    it('should add id to passed quotes according section', () => {
        const quotes = [...BUY_FIXTURE.MIN_MAX_QUOTES_OK];
        const quotesExchange = [...EXCHANGE_FIXTURE.MIN_MAX_QUOTES_OK];

        expect(addIdsToQuotes([], 'buy')).toStrictEqual([]);
        expect(addIdsToQuotes(undefined, 'buy')).toStrictEqual([]);
        expect(addIdsToQuotes(quotes, 'buy').length).toStrictEqual(
            quotes.filter(q => q.orderId && q.paymentId).length,
        );
        expect(addIdsToQuotes(quotesExchange, 'exchange').length).toStrictEqual(
            quotesExchange.filter(q => q.orderId).length,
        );
    });
});

describe('testnetToProdCryptoId', () => {
    it('should convert testnet CryptoId to mainnet CryptoId', () => {
        expect(testnetToProdCryptoId('test-bitcoin' as CryptoId)).toEqual('bitcoin');
        expect(testnetToProdCryptoId('bitcoin' as CryptoId)).toEqual('bitcoin');

        expect(testnetToProdCryptoId('test-ripple' as CryptoId)).toEqual('ripple');
        expect(testnetToProdCryptoId('ripple' as CryptoId)).toEqual('ripple');

        expect(
            testnetToProdCryptoId(
                'test-ethereum--0x1234123412341234123412341234123412341236' as CryptoId,
            ),
        ).toEqual('ethereum--0x1234123412341234123412341234123412341236');
        expect(
            testnetToProdCryptoId(
                'ethereum--0x1234123412341234123412341234123412341236' as CryptoId,
            ),
        ).toEqual('ethereum--0x1234123412341234123412341234123412341236');
    });
});

describe('isCryptoIdForNativeToken', () => {
    it('should test if token is L2 native token', () => {
        expect(isCryptoIdForNativeToken('ethereum' as CryptoId)).toEqual(false);
        expect(
            isCryptoIdForNativeToken(
                'ethereum--0x1234123412341234123412341234123412341236' as CryptoId,
            ),
        ).toEqual(false);
        expect(
            isCryptoIdForNativeToken(
                'ethereum--0x0000000000000000000000000000000000000000' as CryptoId,
            ),
        ).toEqual(true);
        expect(
            isCryptoIdForNativeToken(
                'base--0x0000000000000000000000000000000000000000' as CryptoId,
            ),
        ).toEqual(true);
    });
});

describe('getTradingPaymentMethods', () => {
    it('should get payment methods from quotes', () => {
        const paymentMethods = getTradingPaymentMethods([
            ...BUY_FIXTURE.MIN_MAX_QUOTES_OK,
            BUY_FIXTURE.MIN_MAX_QUOTES_OK[1], // duplicate applePay
        ]);

        const findApplePay = paymentMethods.find(
            paymentMethod =>
                paymentMethod.value === 'applePay' && paymentMethod.label === 'Apple Pay',
        );

        expect(paymentMethods.length).toBe(2);
        expect(findApplePay).toBeDefined();
    });
});

describe('getTradingQuotesByPaymentMethod', () => {
    it('should select quotes according to payment method', () => {
        const quotes = getTradingQuotesByPaymentMethod(BUY_FIXTURE.MIN_MAX_QUOTES_OK, 'applePay');

        const allQuotesApplePay = quotes?.find(quote => quote.paymentMethod === 'applePay');

        expect(allQuotesApplePay).toBeDefined();

        const quotesUndefined = getTradingQuotesByPaymentMethod(undefined, 'applePay');

        expect(quotesUndefined).toBeUndefined();
    });
});

describe('getTradingNetworkDecimals', () => {
    it('should select network decimals according to network or select', () => {
        const network = getNetwork('base');
        const decimals = getTradingNetworkDecimals({
            network,
        });

        expect(decimals).toEqual(network.decimals);

        const decimalsDefault = getTradingNetworkDecimals({
            network: null,
        });

        expect(decimalsDefault).toEqual(8);

        const sendCryptoSelect: TradingAccountOptionsGroupOptionProps = {
            value: 'ethereum' as CryptoId,
            label: 'ETH',
            cryptoName: 'Ethereum',
            balance: '0.0022992',
            descriptor: 'ethereum',
            decimals: 18,
            accountType: 'normal',
        };

        const decimalsWithAccount = getTradingNetworkDecimals({
            network,
            sendCryptoSelect,
        });

        expect(decimalsWithAccount).toEqual(sendCryptoSelect.decimals);
    });
});

describe('cryptoIdToSymbol', () => {
    it.each([
        ['bitcoin', 'btc'],
        ['ethereum', 'eth'],
        ['ethereum--0x1234123412341234123412341234123412341234', 'eth'],
    ] as [CryptoId, NetworkSymbol][])(
        'should return correct symbol for %s',
        (cryptoId, expectedSymbol) => {
            expect(cryptoIdToSymbol(cryptoId)).toBe(expectedSymbol);
        },
    );
});

describe('toTokenCryptoId', () => {
    it('should return correct token cryptoId', () => {
        expect(toTokenCryptoId('eth', '0x1234123412341234123412341234123412341234')).toBe(
            'ethereum--0x1234123412341234123412341234123412341234',
        );
    });
});

describe('getDefaultCountry', () => {
    it('should return default country for unknown country', () => {
        expect(getDefaultCountry()).toEqual({ label: '🌍 Worldwide', value: 'unknown' });
    });

    it('should return correct value', () => {
        expect(getDefaultCountry('US')).toEqual({
            label: '🇺🇸 United States of America',
            value: 'US',
        });
    });

    it('should return default country for non existing code', () => {
        expect(getDefaultCountry('XX')).toEqual({ label: '🌍 Worldwide', value: 'unknown' });
    });
});
