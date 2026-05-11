import { noop } from '../src/noop';

describe(noop.name, () => {
    it('returns undefined', () => {
        expect(noop()).toBeUndefined();
    });

    it('can be called with any arguments', () => {
        expect(() => noop()).not.toThrow();
    });

    it('is assignable as a no-op callback', () => {
        const fn: (value: string) => void = noop;
        expect(() => fn('test')).not.toThrow();
    });
});
