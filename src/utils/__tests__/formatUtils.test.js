import * as formatUtils from '../formatUtils';

describe('format utils', () => {
    it('formatAmount', () => {
        const input = [
            { amount: 0, coinInfo: { isBitcoin: true, currencyUnits: 'mbtc', shortcut: 'btc' } },
            { amount: 0.5, coinInfo: { isBitcoin: true, currencyUnits: 'mbtc', shortcut: 'btc' } },
            { amount: 1, coinInfo: { isBitcoin: false, shortcut: 'eth' } },
            { amount: 99999, coinInfo: { isBitcoin: false, currencyUnits: 'tau' } },
        ];

        input.forEach((entry) => {
            expect(formatUtils.formatAmount(entry.amount, entry.coinInfo)).toMatchSnapshot();
        });
    });

    it('formatTime', () => {
        const input = [0, 1, 2, 100, 999];

        input.forEach((entry) => {
            expect(formatUtils.formatTime(entry)).toMatchSnapshot();
        });
    });

    it('btckb2satoshib', () => {
        const input = [0, 1, 2, 100, 999];

        input.forEach((entry) => {
            expect(formatUtils.btckb2satoshib(entry)).toMatchSnapshot();
        });
    });

    it('stringToHex', () => {
        const input = ['test', '0001', 'test99999'];

        input.forEach((entry) => {
            expect(formatUtils.stringToHex(entry)).toMatchSnapshot();
        });
    });

    it('hexToString', () => {
        const input = [0, 'xxxtestSringtestStringaaaaaa', 30303031, 2746573743939393939, -9];

        input.forEach((entry) => {
            expect(formatUtils.hexToString(entry)).toMatchSnapshot();
        });
    });
});
