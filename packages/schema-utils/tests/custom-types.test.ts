import { Type, Validate } from '../src';

describe('custom-types', () => {
    it('should work with ArrayBuffer', () => {
        const schema = Type.ArrayBuffer();
        expect(schema.type).toEqual('ArrayBuffer');

        const value = new ArrayBuffer(10);
        expect(Validate(schema, value)).toBe(true);

        const invalidValue = 'invalid';
        expect(Validate(schema, invalidValue)).toBe(false);
    });
    it('should work with Buffer', () => {
        const schema = Type.Buffer();
        expect(schema.type).toEqual('Buffer');

        const value = Buffer.from('test');
        expect(Validate(schema, value)).toBe(true);

        const invalidValue = 'invalid';
        expect(Validate(schema, invalidValue)).toBe(false);
    });
    it('should work with Uint', () => {
        const schema = Type.Uint();
        expect(schema.type).toEqual('Uint');

        const value = 10;
        expect(Validate(schema, value)).toBe(true);

        const valueAsString = '10';
        expect(Validate(schema, valueAsString)).toBe(true);

        const invalidInteger = 3.14;
        expect(Validate(schema, invalidInteger)).toBe(false);

        const invalidString = 'xxxx';
        expect(Validate(schema, invalidString)).toBe(false);

        const invalidValue = [123];
        expect(Validate(schema, invalidValue)).toBe(false);
    });
    it('should work with Uint with allowNegative', () => {
        const schema = Type.Uint({ allowNegative: true });
        expect(schema.type).toEqual('Uint');

        const valueAsString = '-10';
        expect(Validate(schema, valueAsString)).toBe(true);
    });
});
