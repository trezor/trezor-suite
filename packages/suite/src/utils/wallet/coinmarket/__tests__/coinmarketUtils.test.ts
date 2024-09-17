import { Account } from 'src/types/wallet';
import {
    buildFiatOption,
    getUnusedAddressFromAccount,
    getCountryLabelParts,
    mapTestnetSymbol,
    getTagAndInfoNote,
    getBestRatedQuote,
    addIdsToQuotes,
    filterQuotesAccordingTags,
    coinmarketGetSortedAccounts,
    coinmarketBuildAccountOptions,
    coinmarketGetRoundedFiatAmount,
    coinmarketGetAmountLabels,
    coinmarketGetAccountLabel,
} from '../coinmarketUtils';
import {
    FIXTURE_ACCOUNTS,
    accountBtc,
    accountEth,
    coinDefinitions,
} from '../__fixtures__/coinmarketUtils';
import * as BUY_FIXTURE from 'src/utils/wallet/coinmarket/__fixtures__/buyUtils';
import * as SELL_FIXTURE from 'src/utils/wallet/coinmarket/__fixtures__/sellUtils';
import * as EXCHANGE_FIXTURE from 'src/utils/wallet/coinmarket/__fixtures__/exchangeUtils';
import { CryptoId } from 'invity-api';
import { useAccountLabel } from 'src/components/suite/AccountLabel';

jest.mock('src/components/suite/AccountLabel', () => ({
    ...jest.requireActual('src/components/suite/AccountLabel'),
    useAccountLabel: jest.fn(),
}));

describe('coinmarket utils', () => {
    it('buildFiatOption', () => {
        expect(buildFiatOption('czk')).toStrictEqual({ value: 'czk', label: 'CZK' });
    });

    it('getUnusedAddressFromAccount', () => {
        expect(getUnusedAddressFromAccount(accountBtc as Account)).toStrictEqual({
            address: '177BUDVZqTTzK1Fogqcrfbb5ketHEUDGSJ',
            path: "m/44'/0'/3'/0/0",
        });

        expect(getUnusedAddressFromAccount(accountEth as Account)).toStrictEqual({
            address: '0x2e0DC981d301cdd443C3987cf19Eb9671CB99ddC',
            path: "m/44'/60'/0'/0/1",
        });
    });

    it('getCountryLabelParts', () => {
        expect(getCountryLabelParts('🇨🇿 Czech Republic')).toStrictEqual({
            flag: '🇨🇿',
            text: 'Czech Republic',
        });
        expect(getCountryLabelParts('aaa')).toStrictEqual({
            flag: '',
            text: 'aaa',
        });
    });

    it('mapTestnetCryptoCurrency', () => {
        expect(mapTestnetSymbol('btc')).toStrictEqual('btc');
        expect(mapTestnetSymbol('eth')).toStrictEqual('eth');
        expect(mapTestnetSymbol('test')).toStrictEqual('btc');
        expect(mapTestnetSymbol('txrp')).toStrictEqual('xrp');
    });

    it('getTagAndInfoNote', () => {
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

    it('filterQuotesAccordingTags', () => {
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

    it('addIdsToQuotes', () => {
        const quotes = [...BUY_FIXTURE.MIN_MAX_QUOTES_OK];
        const quotesExchange = [...EXCHANGE_FIXTURE.MIN_MAX_QUOTES_OK];

        expect(addIdsToQuotes([], 'buy')).toStrictEqual([]);
        expect(addIdsToQuotes(quotes, 'buy').length).toStrictEqual(
            quotes.filter(q => q.orderId && q.paymentId).length,
        );
        expect(addIdsToQuotes(quotesExchange, 'exchange').length).toStrictEqual(
            quotesExchange.filter(q => q.orderId).length,
        );
    });

    describe('getBestRatedQuote', () => {
        it('buy trades (shuffled with error)', () => {
            expect(getBestRatedQuote(BUY_FIXTURE.MIN_MAX_QUOTES_OK, 'buy')).toStrictEqual(
                BUY_FIXTURE.MIN_MAX_QUOTES_OK[1],
            );
        });
        it('sell trades', () => {
            expect(getBestRatedQuote(SELL_FIXTURE.MIN_MAX_QUOTES_OK, 'sell')).toStrictEqual(
                SELL_FIXTURE.MIN_MAX_QUOTES_OK[0],
            );
        });
        it('exchange trades (shuffled)', () => {
            expect(getBestRatedQuote(EXCHANGE_FIXTURE.MIN_MAX_QUOTES_OK, 'exchange')).toStrictEqual(
                EXCHANGE_FIXTURE.MIN_MAX_QUOTES_OK[EXCHANGE_FIXTURE.MIN_MAX_QUOTES_OK.length - 1],
            );
        });
    });

    it('coinmarketGetSortedAccounts', () => {
        const sortedAccounts = coinmarketGetSortedAccounts({
            accounts: FIXTURE_ACCOUNTS as Account[],
            deviceState: '1stTestnetAddress@device_id:0',
        });

        expect(sortedAccounts).toStrictEqual([
            FIXTURE_ACCOUNTS[0],
            FIXTURE_ACCOUNTS[1],
            FIXTURE_ACCOUNTS[2],
            FIXTURE_ACCOUNTS[5],
        ]);
    });

    it('coinmarketBuildAccountOptions', () => {
        const label = 'mocked label';
        const defaultAccountLabelString = (useAccountLabel as jest.Mock).mockImplementation(
            () => label,
        );

        const sortedAccounts = coinmarketBuildAccountOptions({
            accounts: FIXTURE_ACCOUNTS as Account[],
            deviceState: '1stTestnetAddress@device_id:0',
            accountLabels: {},
            defaultAccountLabelString,
            tokenDefinitions: { eth: { coin: coinDefinitions } },
            supportedCryptoIds: new Set([
                'bitcoin',
                'litecoin',
                'ethereum',
                'matic-network',
                'ethereum--0x1234123412341234123412341234123412341236',
            ]) as Set<CryptoId>,
        });

        expect(sortedAccounts).toStrictEqual([
            {
                label,
                options: [
                    {
                        accountType: 'normal',
                        balance: '0',
                        cryptoName: 'Bitcoin',
                        descriptor: 'descriptor1',
                        label: 'BTC',
                        value: 'bitcoin',
                        decimals: 8,
                    },
                ],
            },
            {
                label,
                options: [
                    {
                        accountType: 'normal',
                        balance: '0.101213',
                        cryptoName: 'Litecoin',
                        descriptor: 'descriptor2',
                        label: 'LTC',
                        value: 'litecoin',
                        decimals: 8,
                    },
                ],
            },
            {
                label,
                options: [
                    {
                        accountType: 'normal',
                        balance: '0',
                        cryptoName: 'Ethereum',
                        descriptor: 'descriptor3',
                        label: 'ETH',
                        value: 'ethereum',
                        decimals: 18,
                    },
                    {
                        accountType: 'normal',
                        balance: '2230',
                        contractAddress: '0x1234123412341234123412341234123412341236',
                        cryptoName: 'VeChain',
                        descriptor: 'descriptor3',
                        label: 'VEE',
                        value: 'ethereum--0x1234123412341234123412341234123412341236',
                        decimals: 6,
                    },
                ],
            },
            {
                label,
                options: [
                    {
                        accountType: 'normal',
                        balance: '250',
                        cryptoName: 'Polygon PoS',
                        descriptor: 'descriptor6',
                        label: 'MATIC',
                        value: 'matic-network',
                        decimals: 18,
                    },
                ],
            },
        ]);
    });

    it('coinmarketGetAmountLabels', () => {
        expect(coinmarketGetAmountLabels({ type: 'sell', amountInCrypto: true })).toEqual({
            inputLabel: 'TR_COINMARKET_YOU_PAY',
            offerLabel: 'TR_COINMARKET_YOU_GET',
            labelComparatorOffer: 'TR_COINMARKET_YOU_WILL_GET',
            sendLabel: 'TR_COINMARKET_YOU_GET',
            receiveLabel: 'TR_COINMARKET_YOU_PAY',
        });

        expect(coinmarketGetAmountLabels({ type: 'sell', amountInCrypto: false })).toEqual({
            inputLabel: 'TR_COINMARKET_YOU_GET',
            offerLabel: 'TR_COINMARKET_YOU_PAY',
            labelComparatorOffer: 'TR_COINMARKET_YOU_WILL_PAY',
            sendLabel: 'TR_COINMARKET_YOU_GET',
            receiveLabel: 'TR_COINMARKET_YOU_PAY',
        });

        expect(coinmarketGetAmountLabels({ type: 'buy', amountInCrypto: true })).toEqual({
            inputLabel: 'TR_COINMARKET_YOU_GET',
            offerLabel: 'TR_COINMARKET_YOU_PAY',
            labelComparatorOffer: 'TR_COINMARKET_YOU_WILL_PAY',
            sendLabel: 'TR_COINMARKET_YOU_PAY',
            receiveLabel: 'TR_COINMARKET_YOU_GET',
        });

        expect(coinmarketGetAmountLabels({ type: 'buy', amountInCrypto: false })).toEqual({
            inputLabel: 'TR_COINMARKET_YOU_PAY',
            offerLabel: 'TR_COINMARKET_YOU_GET',
            labelComparatorOffer: 'TR_COINMARKET_YOU_WILL_GET',
            sendLabel: 'TR_COINMARKET_YOU_PAY',
            receiveLabel: 'TR_COINMARKET_YOU_GET',
        });

        expect(coinmarketGetAmountLabels({ type: 'exchange', amountInCrypto: false })).toEqual({
            inputLabel: 'TR_COINMARKET_SWAP_AMOUNT',
            offerLabel: 'TR_COINMARKET_YOU_GET',
            labelComparatorOffer: 'TR_COINMARKET_YOU_WILL_GET',
            sendLabel: 'TR_COINMARKET_SWAP',
            receiveLabel: 'TR_COINMARKET_YOU_RECEIVE',
        });
    });

    it('coinmarketBuildAccountOptions', () => {
        expect(coinmarketGetRoundedFiatAmount('0.23923')).toBe('0.24');
        expect(coinmarketGetRoundedFiatAmount('0.24423')).toBe('0.24');
        expect(coinmarketGetRoundedFiatAmount('0.2')).toBe('0.20');
        expect(coinmarketGetRoundedFiatAmount(undefined)).toBe('');
        expect(coinmarketGetRoundedFiatAmount('293SAsdj2')).toBe(''); // NaN
    });

    it('coinmarketGetAccountLabel', () => {
        expect(coinmarketGetAccountLabel('BTC', true)).toBe('sat');
        expect(coinmarketGetAccountLabel('BTC', false)).toBe('BTC');
        expect(coinmarketGetAccountLabel('USDT', true)).toBe('USDT');
        expect(coinmarketGetAccountLabel('USDT', false)).toBe('USDT');
    });
});
