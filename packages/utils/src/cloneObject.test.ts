import { cloneObject } from './cloneObject';

describe('cloneObject', () => {
    describe('deep cloning of objects', () => {
        it('should clone a simple object', () => {
            const original = { a: 1, b: 2 };
            const cloned = cloneObject(original);
            expect(cloned).toEqual(original);
            expect(cloned).not.toBe(original);
        });

        it('should clone an object with nested properties', () => {
            const original = { a: { b: { c: 3 } } };
            const cloned = cloneObject(original);
            expect(cloned).toEqual(original);
            expect(cloned.a).not.toBe(original.a);
        });

        it('should handle cyclical references', () => {
            const original = { a: 1 };
            // @ts-expect-error"
            original['cyclical'] = original;
            const cloned = cloneObject(original);
            expect(cloned).toEqual(original);
            // @ts-expect-error"
            expect(cloned['cyclical']).toBe(cloned);
        });

        it('should clone arrays', () => {
            const original = [1, 2, 3, { a: 4 }];
            const cloned = cloneObject(original);
            expect(cloned).toEqual(original);
            expect(cloned).not.toBe(original);
            expect(cloned[3]).not.toBe(original[3]);
        });

        it('should handle arrays with cyclical references', () => {
            const original = [1, 2, 3];
            // @ts-expect-error"
            original.push(original);
            const cloned = cloneObject(original);
            expect(cloned).toEqual(original);
            expect(cloned[3]).toBe(cloned);
        });

        it('should clone an object with functions and symbols', () => {
            const original = {
                a: 1,
                b: () => {},
                c: Symbol('symbol'),
            };
            const cloned = cloneObject(original);
            expect(cloned).toEqual({ a: 1 });
            expect(cloned).not.toBe(original);
        });

        it('should clone an ArrayBuffer', () => {
            const original = new ArrayBuffer(8);
            const cloned = cloneObject(original);
            expect(cloned).not.toBe(original);
            expect(cloned.byteLength).toBe(original.byteLength);
        });

        it('should clone typed arrays', () => {
            const original = new Uint8Array([1, 2, 3]);
            const cloned = cloneObject(original);
            expect(cloned).not.toBe(original);
            expect(cloned).toEqual(original);
        });

        it('should keep an own __proto__ key as a property', () => {
            // Unlike an object literal, JSON.parse creates "__proto__" as an own property.
            const original = JSON.parse('{"name":"token","__proto__":{"isVerified":true}}');
            const cloned = cloneObject(original);
            const descriptor = Object.getOwnPropertyDescriptor(cloned, '__proto__');

            expect(Object.getPrototypeOf(cloned)).toBe(Object.prototype);
            expect(Object.keys(cloned)).toEqual(['name', '__proto__']);
            expect(cloned.isVerified).toBeUndefined();
            expect(descriptor).toEqual({
                value: { isVerified: true },
                writable: true,
                enumerable: true,
                configurable: true,
            });
            expect(descriptor?.value).not.toBe(
                Object.getOwnPropertyDescriptor(original, '__proto__')?.value,
            );
        });

        it.each([null, 42, 'text', [1, 2]])(
            'should keep an own __proto__ key holding %p as a property',
            value => {
                const original = JSON.parse(`{"__proto__":${JSON.stringify(value)}}`);
                const cloned = cloneObject(original);

                expect(Object.getPrototypeOf(cloned)).toBe(Object.prototype);
                expect(Object.keys(cloned)).toEqual(['__proto__']);
                expect(Object.getOwnPropertyDescriptor(cloned, '__proto__')?.value).toEqual(value);
            },
        );

        it('should keep own __proto__ keys of objects nested in arrays', () => {
            const original = JSON.parse('{"rates":[{"__proto__":{"usd":1}},{"__proto__":null}]}');
            const cloned = cloneObject(original);

            expect(cloned).toEqual(original);
            expect(cloned.rates.map(Object.getPrototypeOf)).toEqual([
                Object.prototype,
                Object.prototype,
            ]);
        });
    });
});
