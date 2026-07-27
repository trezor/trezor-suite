import { getWeakRandomUUID } from '../src/getWeakRandomUUID';
import { isUUID } from '../src/isUUID';

// Replace every hex digit with 'x' so only the structure (length + hyphen positions) remains.
const shape = (uuid: string) => uuid.replace(/[0-9a-f]/gi, 'x');

describe('getWeakRandomUUID', () => {
    it('has the same format (length and hyphen positions) as crypto.randomUUID()', () => {
        const real = crypto.randomUUID();
        const weak = getWeakRandomUUID();

        expect(weak).toHaveLength(real.length);
        expect(shape(weak)).toBe(shape(real));
    });

    it('is a valid v4 UUID like crypto.randomUUID()', () => {
        const weak = getWeakRandomUUID();

        expect(isUUID(weak)).toBe(true);
        // version nibble and RFC-4122 variant nibble, matching crypto.randomUUID() output
        expect(weak[14]).toBe('4');
        expect('89ab').toContain(weak[19]);
    });
});
