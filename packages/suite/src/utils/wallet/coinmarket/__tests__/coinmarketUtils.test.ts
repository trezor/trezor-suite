import { Account } from 'src/types/wallet';
import {
    buildOption,
    symbolToInvityApiSymbol,
    getUnusedAddressFromAccount,
    getCountryLabelParts,
    mapTestnetSymbol,
    getSendCryptoOptions,
    getTagAndInfoNote,
} from '../coinmarketUtils';
import { accountBtc, accountEth, tokensFiatValue } from '../__fixtures__/coinmarketUtils';

describe('coinmarket utils', () => {
    it('buildOption', () => {
        expect(buildOption('czk')).toStrictEqual({ value: 'czk', label: 'CZK' });
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
            },
        ]);
        expect(
            getSendCryptoOptions(
                accountEth as Account,
                new Set(['eth', 'usdt20', 'usdt', 'usdc', 'dai']),
            ),
        ).toStrictEqual([
            {
                value: 'ETH',
                label: 'ETH',
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
            },
        ]);

        expect(
            getSendCryptoOptions(
                accountEth as Account,
                new Set(['eth', 'usdt20', 'usdc', 'dai']),
                tokensFiatValue,
            ),
        ).toStrictEqual([
            {
                value: 'ETH',
                label: 'ETH',
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
});
