import { combineDisposers } from '../src/combineDisposers';

describe('combineDisposers', () => {
    it('runs all disposers', () => {
        const a = jest.fn();
        const b = jest.fn();
        const c = jest.fn();

        const dispose = combineDisposers(a, b, c);
        dispose();

        expect(a).toHaveBeenCalledTimes(1);
        expect(b).toHaveBeenCalledTimes(1);
        expect(c).toHaveBeenCalledTimes(1);
    });

    it('runs disposers in reverse (LIFO) order', () => {
        const order: string[] = [];
        const dispose = combineDisposers(
            () => order.push('a'),
            () => order.push('b'),
            () => order.push('c'),
        );

        dispose();

        expect(order).toEqual(['c', 'b', 'a']);
    });

    it('is idempotent — calling more than once is a no-op', () => {
        const inner = jest.fn();
        const dispose = combineDisposers(inner);

        dispose();
        dispose();
        dispose();

        expect(inner).toHaveBeenCalledTimes(1);
    });

    it('runs all disposers even if one throws and re-throws the error', () => {
        const a = jest.fn();
        const b = jest.fn(() => {
            throw new Error('boom');
        });
        const c = jest.fn();

        const dispose = combineDisposers(a, b, c);

        expect(() => dispose()).toThrow('boom');
        expect(a).toHaveBeenCalledTimes(1);
        expect(b).toHaveBeenCalledTimes(1);
        expect(c).toHaveBeenCalledTimes(1);
    });

    it('aggregates multiple thrown errors', () => {
        const dispose = combineDisposers(
            () => {
                throw new Error('first');
            },
            () => {
                throw new Error('second');
            },
        );

        expect(() => dispose()).toThrow(AggregateError);
    });

    it('with no disposers does nothing', () => {
        const dispose = combineDisposers();

        expect(() => dispose()).not.toThrow();
    });
});
