import * as utils from '../formatUtils';

describe('format utils', () => {
    // TODO: check this weird function
    it('formatAmount', () => {
        expect(utils.formatAmount(0, { isBitcoin: false, shortcut: 'mbtc' }, 'mbtc')).toBe('0 mbtc');
        expect(utils.formatAmount(1000000, { isBitcoin: true }, 'mbtc')).toBe('10 mBTC');
        expect(utils.formatAmount(0.5, { isBitcoin: true }, 'mbtc')).toBe('0.000005 mBTC');
        expect(utils.formatAmount(1, { isBitcoin: false, shortcut: 'eth' }, null)).toBe('1e-8 eth');
        expect(utils.formatAmount(99999, { isBitcoin: false, shortcut: 'tau' }, null)).toBe('0.00099999 tau');
    });

    it('format time', () => {
        expect(utils.formatTime(0)).toBe('No time estimate');
        expect(utils.formatTime(1)).toBe('1 minutes'); // TODO: should be minute
        expect(utils.formatTime(2)).toBe('2 minutes');
        expect(utils.formatTime(45)).toBe('45 minutes');
        expect(utils.formatTime(100)).toBe('1 hour 40 minutes');
        expect(utils.formatTime(999)).toBe('16 hours 39 minutes');
    });

    it('btckb2satoshib', () => {
        expect(utils.btckb2satoshib(0)).toBe(0);
        expect(utils.btckb2satoshib(1)).toBe(100000);
        expect(utils.btckb2satoshib(2)).toBe(200000);
        expect(utils.btckb2satoshib(100)).toBe(10000000);
        expect(utils.btckb2satoshib(999)).toBe(99900000);
    });

    it('string to hex', () => {
        expect(utils.stringToHex('test')).toBe('0074006500730074');
        expect(utils.stringToHex('0001')).toBe('0030003000300031');
        expect(utils.stringToHex('test99999')).toBe('007400650073007400390039003900390039');
    });

    it('hex to string', () => {
        expect(utils.hexToString('0074006500730074')).toBe('test');
        expect(utils.hexToString('0030003000300031')).toBe('0001');
        expect(utils.hexToString('007400650073007400390039003900390039')).toBe('test99999');
    });
});
