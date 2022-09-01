import { Account } from '@suite/types/wallet';
import {
    buildOption,
    symbolToInvityApiSymbol,
    getUnusedAddressFromAccount,
    getCountryLabelParts,
    mapTestnetSymbol,
    getSendCryptoOptions,
    getTagAndInfoNote,
} from '../coinmarketUtils';
import { accountBtc, accountEth } from '../__fixtures__/coinmarketUtils';

describe('coinmarket utils', () => {
    it('buildOption', () => {
        expect(buildOption('czk')).toStrictEqual({ value: 'czk', label: 'CZK' });
    });

    it('symbolToInvityApiSymbol', () => {
        expect(symbolToInvityApiSymbol('btc')).toStrictEqual('btc');
        expect(symbolToInvityApiSymbol('usdt')).toStrictEqual('usdt20');
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
        expect(mapTestnetSymbol('trop')).toStrictEqual('eth');
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
            getSendCryptoOptions(accountEth as Account, new Set(['eth', 'usdt20', 'usdc', 'dai'])),
        ).toStrictEqual([
            {
                value: 'ETH',
                label: 'ETH',
            },
            {
                value: 'USDT20',
                label: 'USDT20',
            },
            {
                label: 'USDC',
                value: 'USDC',
            },
        ]);
    });

    it('getTagAndInfoNote', () => {
        expect(getTagAndInfoNote({})).toStrictEqual({ infoNote: undefined });
        expect(getTagAndInfoNote({ infoNote: '' })).toStrictEqual({ infoNote: '' });
        expect(getTagAndInfoNote({ infoNote: 'Foo' })).toStrictEqual({ infoNote: 'Foo' });
        expect(getTagAndInfoNote({ infoNote: ' #Foo' })).toStrictEqual({ infoNote: ' #Foo' });
        expect(getTagAndInfoNote({ infoNote: 'Foo#Bar' })).toStrictEqual({ infoNote: 'Foo#Bar' });
        expect(getTagAndInfoNote({ infoNote: '#Foo' })).toStrictEqual({ tag: 'Foo' });
        expect(getTagAndInfoNote({ infoNote: '# Foo' })).toStrictEqual({ tag: ' Foo' });
        expect(getTagAndInfoNote({ infoNote: '##Bar' })).toStrictEqual({ tag: '#Bar' });
    });
});
