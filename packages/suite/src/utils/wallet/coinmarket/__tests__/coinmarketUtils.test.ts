import {
    buildOption,
    formatCryptoAmount,
    symbolToInvityApiSymbol,
    getUnusedAddressFromAccount,
} from '../coinmarketUtils';

describe('coinmarket utils', () => {
    it('buildOption', () => {
        expect(buildOption('czk')).toStrictEqual({ value: 'czk', label: 'CZK' });
    });

    it('symbolToInvityApiSymbol', () => {
        expect(symbolToInvityApiSymbol('btc')).toStrictEqual('btc');
        expect(symbolToInvityApiSymbol('usdt')).toStrictEqual('usdt20');
    });

    it('formatCryptoAmount', () => {
        expect(formatCryptoAmount(Number('194.359760816544300225'))).toStrictEqual('194.3598');
        expect(formatCryptoAmount(Number('0.359760816544300225'))).toStrictEqual('0.359761');
        expect(formatCryptoAmount(Number('0.00123456'))).toStrictEqual('0.00123456');
    });

    it('getUnusedAddressFromAccount', () => {
        const accountMockBtc = {
            index: 1,
            accountType: 'segwit',
            networkType: 'bitcoin',
            symbol: 'btc',
            addresses: {
                unused: [
                    {
                        address: '177BUDVZqTTzK1Fogqcrfbb5ketHEUDGSJ',
                        transfers: 0,
                        path: "m/44'/0'/3'/0/0",
                    },
                ],
            },
        };
        // @ts-ignore
        expect(getUnusedAddressFromAccount(accountMockBtc)).toStrictEqual({
            address: '177BUDVZqTTzK1Fogqcrfbb5ketHEUDGSJ',
            path: "m/44'/0'/3'/0/0",
        });

        const accountMockEth = {
            index: 1,
            accountType: 'normal',
            networkType: 'ethereum',
            symbol: 'eth',
            descriptor: '0x2e0DC981d301cdd443C3987cf19Eb9671CB99ddC',
            path: "m/44'/60'/0'/0/1",
        };

        // @ts-ignore
        expect(getUnusedAddressFromAccount(accountMockEth)).toStrictEqual({
            address: '0x2e0DC981d301cdd443C3987cf19Eb9671CB99ddC',
            path: "m/44'/60'/0'/0/1",
        });
    });
});
