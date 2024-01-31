import {
    cryptoToNetworkSymbol,
    cryptoToCoinSymbol,
    isCryptoSymbolToken,
    networkToCryptoSymbol,
    tokenToCryptoSymbol,
} from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';

describe('cryptoSymbolUtils', () => {
    it.each<[Parameters<typeof isCryptoSymbolToken>[0], ReturnType<typeof isCryptoSymbolToken>]>([
        ['BTC', false],
        ['ETH', false],
        ['XRP', false],
        ['USDT@ETH', true],
        ['USDC@ETH', true],
        ['_unknown' as Parameters<typeof isCryptoSymbolToken>[0], false],
    ])(`${isCryptoSymbolToken.name} %s`, (symbol, expected) => {
        expect(isCryptoSymbolToken(symbol)).toEqual(expected);
    });

    it.each<[Parameters<typeof cryptoToCoinSymbol>[0], ReturnType<typeof cryptoToCoinSymbol>]>([
        ['BTC', 'BTC'],
        ['ETH', 'ETH'],
        ['XRP', 'XRP'],
        ['USDT@ETH', 'USDT'],
        ['USDC@ETH', 'USDC'],
        ['_unknown' as Parameters<typeof cryptoToCoinSymbol>[0], '_unknown'],
    ])(`${cryptoToCoinSymbol.name} %s`, (symbol, expected) => {
        expect(cryptoToCoinSymbol(symbol)).toEqual(expected);
    });

    it.each<
        [Parameters<typeof networkToCryptoSymbol>[0], ReturnType<typeof networkToCryptoSymbol>]
    >([
        ['btc', 'BTC'],
        ['eth', 'ETH'],
        ['xrp', 'XRP'],
        ['_unknown' as Parameters<typeof networkToCryptoSymbol>[0], undefined],
    ])(`${networkToCryptoSymbol.name} %s`, (symbol, expected) => {
        expect(networkToCryptoSymbol(symbol)).toEqual(expected);
    });

    it.each<
        [Parameters<typeof cryptoToNetworkSymbol>[0], ReturnType<typeof cryptoToNetworkSymbol>]
    >([
        ['BTC', 'btc'],
        ['ETH', 'eth'],
        ['XRP', 'xrp'],
        ['USDT@ETH', 'eth'],
        ['USDC@ETH', 'eth'],
        ['USDT@MATIC', 'matic'],
        ['USDC@MATIC', 'matic'],
        ['_unknown' as Parameters<typeof cryptoToNetworkSymbol>[0], undefined],
    ])(`${cryptoToNetworkSymbol.name} %s`, (symbol, expected) => {
        expect(cryptoToNetworkSymbol(symbol)).toEqual(expected);
    });

    it.each<[Parameters<typeof tokenToCryptoSymbol>, ReturnType<typeof tokenToCryptoSymbol>]>([
        [['USDT', 'eth'], 'USDT@ETH'],
        [['USDC', 'eth'], 'USDC@ETH'],
        [['USDT', 'matic'], 'USDT@MATIC'],
        [['USDC', 'matic'], 'USDC@MATIC'],
        [['USDT', '_unknown' as Parameters<typeof tokenToCryptoSymbol>[1]], undefined],
    ])(`${tokenToCryptoSymbol.name} %s`, (params, expected) => {
        expect(tokenToCryptoSymbol(...params)).toEqual(expected);
    });
});
