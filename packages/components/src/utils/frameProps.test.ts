import { makePropsTransient } from './transientProps';

describe('frameprops', () => {
    describe('type tests', () => {
        it('should return the same keys just with the $ prefix as type', () => {
            const result: {
                $a: 1;
                $b: 2;
            } = makePropsTransient({ a: 1, b: 2 } as const);
            expect(result).toEqual({
                $a: 1,
                $b: 2,
            });
        });

        it('should correctly be able to pick individual key', () => {
            const result: {
                $a: 1;
                $b: 2;
            } = makePropsTransient({ a: 1, b: 2 } as const);

            const a = result.$a;
            expect(a).toEqual(1);
        });

        it('should throw a type error when the resulting object is not assigned to a variable with a $ prefix', () => {
            // @ts-expect-error: here should be $ prefix for the key
            const result: {
                a: 1;
                $b: 2;
            } = makePropsTransient({ a: 1, b: 2 } as const);
            expect(result).toEqual({
                $a: 1,
                $b: 2,
            });
        });
        it('should throw a type error when trying to get the key that is not specified in the argument object', () => {
            // @ts-expect-error: c is not a key of the object
            const result: {
                $c: 1;
            } = makePropsTransient({ a: 1, b: 2 } as const);
            expect(result).toEqual({
                $a: 1,
                $b: 2,
            });
        });

        it('should throw a type error when trying to access a key without a $ prefix', () => {
            const result: {
                $a: 1;
                $b: 2;
            } = makePropsTransient({ a: 1, b: 2 } as const);

            // @ts-expect-error: here should be $ prefix for the key
            const { a } = result;
            expect(a).toEqual(undefined);
        });
    });
});
