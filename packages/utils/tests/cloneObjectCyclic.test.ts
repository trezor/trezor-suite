import { cloneObjectCyclic } from '../src/cloneObjectCyclic';

describe('cloneObjectCyclic', () => {
    describe('deep cloning of objects', () => {
        it('should clone a simple object', () => {
            const original = { a: 1, b: 2 };
            const cloned = cloneObjectCyclic(original);
            expect(cloned).toEqual(original);
            expect(cloned).not.toBe(original);
        });

        it('should clone an object with nested properties', () => {
            const original = { a: { b: { c: 3 } } };
            const cloned = cloneObjectCyclic(original);
            expect(cloned).toEqual(original);
            expect(cloned.a).not.toBe(original.a);
        });

        it('should handle cyclical references', () => {
            const original = { a: 1 };
            // @ts-expect-error"
            original['cyclical'] = original;
            const cloned = cloneObjectCyclic(original);
            expect(cloned).toEqual(original);
            // @ts-expect-error"
            expect(cloned['cyclical']).toBe(cloned);
        });

        it('should clone arrays', () => {
            const original = [1, 2, 3, { a: 4 }];
            const cloned = cloneObjectCyclic(original);
            expect(cloned).toEqual(original);
            expect(cloned).not.toBe(original);
            expect(cloned[3]).not.toBe(original[3]);
        });

        it('should handle arrays with cyclical references', () => {
            const original = [1, 2, 3];
            // @ts-expect-error"
            original.push(original);
            const cloned = cloneObjectCyclic(original);
            expect(cloned).toEqual(original);
            expect(cloned[3]).toBe(cloned);
        });

        it('should clone an object with functions and symbols', () => {
            const original = {
                a: 1,
                b: () => {},
                c: Symbol('symbol'),
            };
            const cloned = cloneObjectCyclic(original);
            expect(cloned).toEqual({ a: 1 });
            expect(cloned).not.toBe(original);
        });

        it('should clone an ArrayBuffer', () => {
            const original = new ArrayBuffer(8);
            const cloned = cloneObjectCyclic(original);
            expect(cloned).not.toBe(original);
            expect(cloned.byteLength).toBe(original.byteLength);
        });

        it('should clone typed arrays', () => {
            const original = new Uint8Array([1, 2, 3]);
            const cloned = cloneObjectCyclic(original);
            expect(cloned).not.toBe(original);
            expect(cloned).toEqual(original);
        });
    });
});
