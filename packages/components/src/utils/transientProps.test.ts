import { makePropsTransient } from './transientProps';

describe('transientProps', () => {
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

        it("should should throw an a type error when there isn't a property with a $ prefix", () => {
            // @ts-expect-error: here should be $ prefixes for the keys
            const result: {
                a: 1;
                b: 2;
            } = makePropsTransient({ a: 1, b: 2 } as const);
            expect(result).toEqual({
                $a: 1,
                $b: 2,
            });
        });
    });
});
