import {
    formatEthereumAmount,
    formatGasPrice,
    formatTokenAmount,
    sumWei,
} from './formatEthereumAmount';

describe('formatEthereumAmount', () => {
    it.each([
        ['0', '0 ETH'],
        ['1', '0.000000000000000001 ETH'],
        ['1000000000000000000', '1 ETH'],
        ['999496000000000000', '0.999496 ETH'],
        ['12345678900000000000000', '12345.6789 ETH'],
    ])('formats %s wei as %s', (wei, formatted) => {
        expect(formatEthereumAmount(wei, 'ETH')).toBe(formatted);
    });

    it('uses the symbol it is given', () => {
        expect(formatEthereumAmount('500000000000000000', 'ETC')).toBe('0.5 ETC');
    });

    it.each(['', 'abc', '-5', '1.5', '1e18'])(
        'does not throw on the malformed amount "%s"',
        wei => {
            expect(formatEthereumAmount(wei, 'ETH')).toBe('unknown amount');
        },
    );
});

describe('formatGasPrice', () => {
    it.each([
        ['24000000000', '24 gwei'],
        ['1500000000', '1.5 gwei'],
        ['1', '0.000000001 gwei'],
    ])('formats %s wei per gas as %s', (wei, formatted) => {
        expect(formatGasPrice(wei)).toBe(formatted);
    });
});

describe('formatTokenAmount', () => {
    it('uses the decimals of the token', () => {
        expect(formatTokenAmount({ balance: '1500000', decimals: 6, symbol: 'USDC' })).toBe(
            '1.5 USDC',
        );
        expect(formatTokenAmount({ balance: '7', decimals: 0 })).toBe('7 tokens');
    });

    it('does not throw on malformed data', () => {
        expect(formatTokenAmount({ balance: 'x', decimals: 6, symbol: 'USDC' })).toBe(
            'unknown amount of USDC',
        );
        expect(formatTokenAmount({ balance: '1', decimals: -1, symbol: 'USDC' })).toBe(
            'unknown amount of USDC',
        );
    });
});

describe('sumWei', () => {
    it('adds amounts beyond the safe integer range exactly', () => {
        expect(sumWei(['9007199254740993', '1'])).toBe(9007199254740994n);
        expect(sumWei([])).toBe(0n);
    });
});
