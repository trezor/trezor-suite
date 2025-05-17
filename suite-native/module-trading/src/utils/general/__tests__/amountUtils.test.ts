import { truncateDecimals } from '../amountUtils';

describe('amountUtils', () => {
    describe('truncateDecimals', () => {
        it('should return unchanged value when decimals are undefined', () => {
            expect(truncateDecimals('0.123456789', undefined)).toEqual('0.123456789');
        });

        it('should return undefined when value is undefined', () => {
            expect(truncateDecimals(undefined, 2)).toEqual(undefined);
        });

        it.each<[string, string]>([
            ['0.123456789', '0.12'],
            ['123', '123'],
        ])('should truncate decimal values', (value, expected) => {
            expect(truncateDecimals(value, 2)).toEqual(expected);
        });
    });
});
