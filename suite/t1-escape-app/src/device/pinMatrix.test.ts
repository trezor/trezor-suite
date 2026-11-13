import {
    MAX_PIN_LENGTH,
    PIN_MATRIX_ROWS,
    appendPinPosition,
    isSubmittablePin,
    removeLastPinPosition,
} from './pinMatrix';

describe('PIN matrix', () => {
    it('lays the positions out like a numeric keypad', () => {
        expect(PIN_MATRIX_ROWS).toEqual([
            [7, 8, 9],
            [4, 5, 6],
            [1, 2, 3],
        ]);
    });

    it('appends positions up to nine digits and then stops', () => {
        const full = [1, 2, 3, 4, 5, 6, 7, 8, 9].reduce(appendPinPosition, '');

        expect(full).toBe('123456789');
        expect(full).toHaveLength(MAX_PIN_LENGTH);
        expect(appendPinPosition(full, 1)).toBe(full);
    });

    it('ignores positions outside the matrix', () => {
        expect(appendPinPosition('12', 0)).toBe('12');
        expect(appendPinPosition('12', 10)).toBe('12');
        expect(appendPinPosition('12', 1.5)).toBe('12');
    });

    it('removes the last position', () => {
        expect(removeLastPinPosition('123')).toBe('12');
        expect(removeLastPinPosition('')).toBe('');
    });

    it.each([
        ['', false],
        ['1', true],
        ['123456789', true],
        ['1234567891', false],
        ['120', false],
        ['12a', false],
    ])('PIN "%s" can be submitted: %s', (pin, isSubmittable) => {
        expect(isSubmittablePin(pin)).toBe(isSubmittable);
    });
});
