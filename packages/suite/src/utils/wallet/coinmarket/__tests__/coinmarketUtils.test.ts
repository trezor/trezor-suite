import { Account } from 'src/types/wallet';
import {
    buildFiatOption,
    symbolToInvityApiSymbol,
    getUnusedAddressFromAccount,
    getCountryLabelParts,
    mapTestnetSymbol,
    getSendCryptoOptions,
    getTagAndInfoNote,
    buildCryptoOption,
    processSellAndBuyQuotes,
} from '../coinmarketUtils';
import { accountBtc, accountEth, coinDefinitions } from '../__fixtures__/coinmarketUtils';
import { ALTERNATIVE_QUOTES, MIN_MAX_QUOTES_OK } from '../__fixtures__/buyUtils';
import { CryptoSymbol, CryptoSymbolInfo } from 'invity-api';
import {
    CryptoCategoryA,
    CryptoCategoryB,
    CryptoCategoryC,
    CryptoCategoryD,
    CryptoCategoryE,
} from 'src/constants/wallet/coinmarket/cryptoCategories';

describe('coinmarket utils', () => {
    it('buildFiatOption', () => {
        expect(buildFiatOption('czk')).toStrictEqual({ value: 'czk', label: 'CZK' });
    });

    it('buildCryptoOption', () => {
        expect(buildCryptoOption('BTC')).toStrictEqual({
            value: 'BTC',
            label: 'BTC',
            cryptoName: 'Bitcoin',
        });
        expect(buildCryptoOption('ETH')).toStrictEqual({
            value: 'ETH',
            label: 'ETH',
            cryptoName: 'Ethereum',
        });
        expect(buildCryptoOption('USDT@ETH')).toStrictEqual({
            value: 'USDT@ETH',
            label: 'USDT',
            cryptoName: 'Ethereum',
        });
    });

    it('symbolToInvityApiSymbol', () => {
        expect(symbolToInvityApiSymbol('btc')).toStrictEqual('btc');
        expect(symbolToInvityApiSymbol('usdt')).toStrictEqual('usdt');
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

    it('getSendCryptoOptions', () => {
        expect(getSendCryptoOptions(accountBtc as Account, new Set())).toStrictEqual([
            {
                value: 'BTC',
                label: 'BTC',
                cryptoSymbol: 'BTC',
            },
        ]);

        expect(
            getSendCryptoOptions(
                accountEth as Account,
                new Set(['ETH', 'USDT@ETH', 'USDC@ETH', 'DAI@ETH']),
            ),
        ).toStrictEqual([
            {
                value: 'ETH',
                label: 'ETH',
                cryptoSymbol: 'ETH',
            },
            {
                value: 'USDT',
                label: 'USDT',
                token: {
                    type: 'ERC20',
                    contract: '0x1234123412341234123412341234123412341234',
                    symbol: 'usdt',
                    decimals: 18,
                },
                cryptoSymbol: 'USDT@ETH',
            },
            {
                label: 'USDC',
                value: 'USDC',
                token: {
                    type: 'ERC20',
                    contract: '0x1234123412341234123412341234123412341235',
                    symbol: 'usdc',
                    decimals: 18,
                },
                cryptoSymbol: 'USDC@ETH',
            },
        ]);

        expect(
            getSendCryptoOptions(
                accountEth as Account,
                new Set(['ETH', 'USDT@ETH', 'USDC@ETH', 'DAI@ETH']),
                coinDefinitions,
            ),
        ).toStrictEqual([
            {
                value: 'ETH',
                label: 'ETH',
                cryptoSymbol: 'ETH',
            },
            {
                label: 'USDC',
                value: 'USDC',
                token: {
                    type: 'ERC20',
                    contract: '0x1234123412341234123412341234123412341235',
                    symbol: 'usdc',
                    decimals: 18,
                },
                cryptoSymbol: 'USDC@ETH',
            },
        ]);
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

    it('processSellAndBuyQuotes', () => {
        const quotes = [...MIN_MAX_QUOTES_OK, ...ALTERNATIVE_QUOTES];

        expect(processSellAndBuyQuotes([])).toStrictEqual([]);
        expect(processSellAndBuyQuotes(quotes).length).toStrictEqual(
            quotes.filter(
                q =>
                    (!q.tags || !q.tags.includes('alternativeCurrency')) &&
                    q.orderId &&
                    q.paymentId,
            ).length,
        );
    });

    it('function coinmarketBuildCryptoOptions', () => {
        const symbolsInfo: CryptoSymbolInfo[] = [
            {
                symbol: 'BTC',
                name: 'Bitcoin',
                category: 'Popular currencies',
            },
            {
                symbol: 'ETH',
                name: 'Ethereum',
                category: 'Popular currencies',
            },
            {
                symbol: 'USDT@ETH',
                name: 'Tether',
                category: 'Ethereum ERC20 tokens',
            },
            {
                symbol: 'USDT@MATIC',
                name: 'Tether',
                category: 'Polygon ERC20 tokens',
            },
        ];
        const cryptoCurrencies: Set<CryptoSymbol> = new Set([
            'BTC',
            'ETH',
            'USDT@ETH',
            'USDT@MATIC',
            'VEN',
            'STEEM',
        ]);

        expect(
            coinmarketBuildCryptoOptions({
                symbolsInfo,
                cryptoCurrencies,
            }),
        ).toStrictEqual([
            {
                label: CryptoCategoryA,
                options: [
                    {
                        value: 'BTC',
                        label: 'BTC',
                        cryptoName: 'Bitcoin',
                    },
                    {
                        value: 'ETH',
                        label: 'ETH',
                        cryptoName: 'Ethereum',
                    },
                ],
            },
            {
                label: CryptoCategoryB,
                options: [
                    {
                        value: 'USDT@ETH',
                        label: 'USDT',
                        cryptoName: 'Tether',
                    },
                ],
            },
            {
                label: CryptoCategoryC,
                options: [],
            },
            {
                label: CryptoCategoryD,
                options: [
                    {
                        value: 'USDT@MATIC',
                        label: 'USDT',
                        cryptoName: 'Tether',
                    },
                ],
            },
            {
                label: CryptoCategoryE,
                options: [
                    {
                        value: 'VEN',
                        label: 'VEN',
                        cryptoName: null,
                    },
                    {
                        value: 'STEEM',
                        label: 'STEEM',
                        cryptoName: null,
                    },
                ],
            },
        ]);
    });
});
