import * as formatUtils from '../formatUtils';

describe('format utils', () => {
    it('formatAmount', () => {
        const input = [
            { amount: 0, coinInfo: { isBitcoin: true, currencyUnits: 'mbtc', shortcut: 'btc' } },
            { amount: 1000000, coinInfo: { isBitcoin: true, currencyUnits: 'mbtc', shortcut: 'btc' } },
            { amount: 0.5, coinInfo: { isBitcoin: true, currencyUnits: 'mbtc', shortcut: 'btc' } },
            { amount: 1, coinInfo: { isBitcoin: false, shortcut: 'eth' } },
            { amount: 99999, coinInfo: { isBitcoin: false, shortcut: 'tau' } },
        ];

        input.forEach((entry) => {
            expect(formatUtils.formatAmount(entry.amount, entry.coinInfo, entry.coinInfo.currencyUnits)).toMatchSnapshot();
        });
    });

    it('formatTime', () => {
        const input = [0, 1, 2, 100, 999, 45];

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
        const input = ['0074006500730074', '0030003000300031', '007400650073007400390039003900390039'];

        input.forEach((entry) => {
            expect(formatUtils.hexToString(entry)).toMatchSnapshot();
        });
    });
});
