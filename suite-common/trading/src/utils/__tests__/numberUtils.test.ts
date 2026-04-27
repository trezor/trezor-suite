import { BigNumber } from '@trezor/utils';

import { clamp, formatExchangeRate } from '../numberUtils';

describe('numberUtils', () => {
    it('clamp - value within bounds', () => {
        expect(clamp(5, 0, 10)).toBe(5);
    });

    it('clamp - value below min', () => {
        expect(clamp(-5, 0, 10)).toBe(0);
    });

    it('clamp - value above max', () => {
        expect(clamp(15, 0, 10)).toBe(10);
    });

    it('clamp - default bounds', () => {
        expect(clamp(0)).toBe(0);
        expect(clamp(-100)).toBe(-100);
        expect(clamp(100)).toBe(100);
    });

    it('clamp - value below custom min', () => {
        expect(clamp(5, 10, 20)).toBe(10);
    });

    it('clamp - value above custom max', () => {
        expect(clamp(25, 10, 20)).toBe(20);
    });
});

describe('formatExchangeRate', () => {
    it('rate >= 1 uses 3 decimal places', () => {
        expect(formatExchangeRate(new BigNumber('34.45023'))).toBe('34.450');
    });

    it('rate = 1 uses 3 decimal places', () => {
        expect(formatExchangeRate(new BigNumber('1'))).toBe('1.000');
    });

    it('rate < 1 shows 5 significant figures', () => {
        expect(formatExchangeRate(new BigNumber('0.0000753232344'))).toBe('0.000075323');
    });

    it('rate < 1 pads with trailing zeros for alignment', () => {
        expect(formatExchangeRate(new BigNumber('0.000075'))).toBe('0.000075000');
    });

    it('rate close to 1 shows 5 significant figures', () => {
        expect(formatExchangeRate(new BigNumber('0.5'))).toBe('0.50000');
    });
});
