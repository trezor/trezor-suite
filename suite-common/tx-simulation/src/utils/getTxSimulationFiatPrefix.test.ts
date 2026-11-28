import { getTxSimulationFiatPrefix } from './getTxSimulationFiatPrefix';

describe('getTxSimulationFiatPrefix', () => {
    it.each(['0', '0.000000000000000001', '0.004999'])(
        'replaces the minus with ≈ for an outflow of %s',
        value => {
            expect(getTxSimulationFiatPrefix(value, '-')).toBe('≈');
        },
    );

    it.each(['0.005', '0.01', '12.34'])('keeps the minus for an outflow of %s', value => {
        expect(getTxSimulationFiatPrefix(value, '-')).toBe('-');
    });

    it('keeps the plus for an inflow that rounds to zero', () => {
        expect(getTxSimulationFiatPrefix('0.001', '+')).toBe('+');
    });

    it('returns no prefix when none is given', () => {
        expect(getTxSimulationFiatPrefix('0.001', undefined)).toBeUndefined();
    });
});
