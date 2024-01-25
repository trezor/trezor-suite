import { AssertWeak, Type } from '../src';

describe('weak-assert', () => {
    it('should not throw if type is mismatched', () => {
        const schema = Type.Object({
            foo: Type.String(),
        });
        const value = {
            foo: 123,
        };

        console.warn = jest.fn();
        expect(() => AssertWeak(schema, value)).not.toThrow();
        expect(console.warn).toHaveBeenCalledTimes(1);
    });

    it('should not throw if a property is mismatched in a union', () => {
        const schema = Type.Union([
            Type.Object({
                foo: Type.String(),
            }),
            Type.Object({
                bar: Type.Number(),
            }),
        ]);
        const value = {
            foo: 123,
        };

        console.warn = jest.fn();
        expect(() => AssertWeak(schema, value)).not.toThrow();
        expect(console.warn).toHaveBeenCalledTimes(1);
    });

    it('should throw if a required field is missing', () => {
        const schema = Type.Object({
            foo: Type.String(),
        });
        const value = {};

        expect(() => AssertWeak(schema, value)).toThrow();
    });
});
