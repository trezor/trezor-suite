import { CryptoId } from 'invity-api';

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
    tradingGetSortedAccounts,
    tradingBuildAccountOptions,
    tradingGetRoundedFiatAmount,
    tradingGetAmountLabels,
    tradingGetAccountLabel,
    testnetToProdCryptoId,
    getAddressAndTokenFromAccountOptionsGroupProps,
    isCryptoIdForNativeToken,
    getTradeTypeByRoute,
} from 'src/utils/wallet/trading/tradingUtils';
import {
    FIXTURE_ACCOUNTS,
    FIXTURE_ACCOUNT_OPTIONS,
    accountBtc,
    accountEth,
    coinDefinitions,
} from 'src/utils/wallet/trading/__fixtures__/tradingUtils';
import * as BUY_FIXTURE from 'src/utils/wallet/trading/__fixtures__/buyUtils';
import * as SELL_FIXTURE from 'src/utils/wallet/trading/__fixtures__/sellUtils';
import * as EXCHANGE_FIXTURE from 'src/utils/wallet/trading/__fixtures__/exchangeUtils';
import { useDefaultAccountLabel } from 'src/hooks/suite/useDefaultAccountLabel';

jest.mock('src/hooks/suite/useDefaultAccountLabel', () => ({
    ...jest.requireActual('src/hooks/suite/useDefaultAccountLabel'),
    useDefaultAccountLabel: jest.fn(),
}));

describe('trading utils', () => {
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

    it('tradingGetSortedAccounts', () => {
        const sortedAccounts = tradingGetSortedAccounts({
            accounts: FIXTURE_ACCOUNTS as Account[],
            deviceState: '1stTestnetAddress@device_id:0',
        });

        expect(sortedAccounts).toStrictEqual([
            FIXTURE_ACCOUNTS[0],
            FIXTURE_ACCOUNTS[2],
            FIXTURE_ACCOUNTS[5],
            FIXTURE_ACCOUNTS[1],
        ]);
    });

    it('tradingBuildAccountOptions', () => {
        const label = 'mocked label';
        const getDefaultAccountLabel = (useDefaultAccountLabel as jest.Mock).mockImplementation(
            () => label,
        );

        const sortedAccounts = tradingBuildAccountOptions({
            accounts: FIXTURE_ACCOUNTS as Account[],
            deviceState: '1stTestnetAddress@device_id:0',
            accountLabels: {},
            getDefaultAccountLabel,
            tokenDefinitions: { eth: { coin: coinDefinitions } },
            supportedCryptoIds: new Set([
                'bitcoin',
                'litecoin',
                'ethereum',
                'polygon-ecosystem-token',
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
                        cryptoName: 'Polygon',
                        descriptor: 'descriptor6',
                        label: 'POL',
                        value: 'polygon-ecosystem-token',
                        decimals: 18,
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
        ]);
    });

    it('tradingGetAmountLabels', () => {
        expect(tradingGetAmountLabels({ type: 'sell', amountInCrypto: true })).toEqual({
            inputLabel: 'TR_TRADING_YOU_PAY',
            offerLabel: 'TR_TRADING_YOU_GET',
            labelComparatorOffer: 'TR_TRADING_YOU_WILL_GET',
            sendLabel: 'TR_TRADING_YOU_GET',
            receiveLabel: 'TR_TRADING_YOU_PAY',
        });

        expect(tradingGetAmountLabels({ type: 'sell', amountInCrypto: false })).toEqual({
            inputLabel: 'TR_TRADING_YOU_GET',
            offerLabel: 'TR_TRADING_YOU_PAY',
            labelComparatorOffer: 'TR_TRADING_YOU_WILL_PAY',
            sendLabel: 'TR_TRADING_YOU_GET',
            receiveLabel: 'TR_TRADING_YOU_PAY',
        });

        expect(tradingGetAmountLabels({ type: 'buy', amountInCrypto: true })).toEqual({
            inputLabel: 'TR_TRADING_YOU_GET',
            offerLabel: 'TR_TRADING_YOU_PAY',
            labelComparatorOffer: 'TR_TRADING_YOU_WILL_PAY',
            sendLabel: 'TR_TRADING_YOU_PAY',
            receiveLabel: 'TR_TRADING_YOU_GET',
        });

        expect(tradingGetAmountLabels({ type: 'buy', amountInCrypto: false })).toEqual({
            inputLabel: 'TR_TRADING_YOU_PAY',
            offerLabel: 'TR_TRADING_YOU_GET',
            labelComparatorOffer: 'TR_TRADING_YOU_WILL_GET',
            sendLabel: 'TR_TRADING_YOU_PAY',
            receiveLabel: 'TR_TRADING_YOU_GET',
        });

        expect(tradingGetAmountLabels({ type: 'exchange', amountInCrypto: false })).toEqual({
            inputLabel: 'TR_TRADING_SWAP_AMOUNT',
            offerLabel: 'TR_TRADING_YOU_GET',
            labelComparatorOffer: 'TR_TRADING_YOU_WILL_GET',
            sendLabel: 'TR_TRADING_SWAP',
            receiveLabel: 'TR_TRADING_YOU_RECEIVE',
        });
    });

    it('tradingBuildAccountOptions: basic', () => {
        expect(tradingGetRoundedFiatAmount('0.23923')).toBe('0.24');
        expect(tradingGetRoundedFiatAmount('0.24423')).toBe('0.24');
        expect(tradingGetRoundedFiatAmount('0.2')).toBe('0.20');
        expect(tradingGetRoundedFiatAmount(undefined)).toBe('');
        expect(tradingGetRoundedFiatAmount('293SAsdj2')).toBe(''); // NaN
    });

    it('tradingGetAccountLabel', () => {
        expect(tradingGetAccountLabel('BTC', true)).toBe('sat');
        expect(tradingGetAccountLabel('BTC', false)).toBe('BTC');
        expect(tradingGetAccountLabel('USDT', true)).toBe('USDT');
        expect(tradingGetAccountLabel('USDT', false)).toBe('USDT');
    });

    it('testnetToProdCryptoId', () => {
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

    it('getAddressAndTokenFromAccountOptionsGroupProps - testing correct returning value fot setting FormState to send currency', () => {
        FIXTURE_ACCOUNT_OPTIONS.forEach(item => {
            expect(getAddressAndTokenFromAccountOptionsGroupProps(item.option)).toEqual(
                item.result,
            );
        });
    });

    it('isCryptoIdForNativeToken - test if token is L2 native token', () => {
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

    it('getTradeTypeByRoute - testing correct returning trade section according to route', () => {
        expect(getTradeTypeByRoute('wallet-trading-buy')).toEqual('buy');
        expect(getTradeTypeByRoute('wallet-trading-buy-detail')).toEqual('buy');
        expect(getTradeTypeByRoute('wallet-trading-buy-offers')).toEqual('buy');
        expect(getTradeTypeByRoute('wallet-trading-buy-confirm')).toEqual('buy');

        expect(getTradeTypeByRoute('wallet-trading-sell')).toEqual('sell');
        expect(getTradeTypeByRoute('wallet-trading-sell-detail')).toEqual('sell');
        expect(getTradeTypeByRoute('wallet-trading-sell-offers')).toEqual('sell');
        expect(getTradeTypeByRoute('wallet-trading-sell-confirm')).toEqual('sell');

        expect(getTradeTypeByRoute('wallet-trading-exchange')).toEqual('exchange');
        expect(getTradeTypeByRoute('wallet-trading-exchange-detail')).toEqual('exchange');
        expect(getTradeTypeByRoute('wallet-trading-exchange-offers')).toEqual('exchange');
        expect(getTradeTypeByRoute('wallet-trading-exchange-confirm')).toEqual('exchange');

        expect(getTradeTypeByRoute('wallet-trading-dca')).toEqual(undefined);
        expect(getTradeTypeByRoute('wallet-index')).toEqual(undefined);
    });
});
