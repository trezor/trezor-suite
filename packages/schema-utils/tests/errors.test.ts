import { Type, Assert } from '../src/index';
import { InvalidParameter } from '../src/errors';

describe('Assert', () => {
    it('should not throw an error if matches schema', () => {
        const schema = Type.Object({ type: Type.String() });
        const value = { type: 'string' };
        expect(() => Assert(schema, value)).not.toThrow();
    });

    it('acts as a type guard', () => {
        const schema = Type.Object({ type: Type.String() });
        const value = { type: 'string' };
        Assert(schema, value);
        // @ts-expect-error
        value.type = 123;
    });

    it('should throw if type is mismateched', () => {
        const schema = Type.Object({ type: Type.Number() });
        const value = { type: 'string' };
        expect(() => Assert(schema, value)).toThrow(InvalidParameter);
        // Check error message
        try {
            Assert(schema, value);
        } catch (e) {
            expect(e.message).toEqual('Invalid parameter "type" (= "string"): Expected number');
        }
    });

    it('should throw if required field is missing', () => {
        const schema = Type.Object({ type: Type.Number() });
        const value = {};
        expect(() => Assert(schema, value)).toThrow(InvalidParameter);
        // Check error message
        try {
            Assert(schema, value);
        } catch (e) {
            expect(e.message).toEqual('Invalid parameter "type" (= undefined): Required property');
        }
    });

    it('should throw in case of custom types', () => {
        const schema = Type.Object({ type: Type.Uint() });
        const value = { type: 'xyz' };
        expect(() => Assert(schema, value)).toThrow(InvalidParameter);
        // Check error message
        try {
            Assert(schema, value);
        } catch (e) {
            expect(e.message).toEqual('Invalid parameter "type" (= "xyz"): Expected kind "Uint"');
        }
    });

    it('should throw when conditions are not met', () => {
        const schema = Type.Object({ type: Type.String({ minLength: 3 }) });
        const value = { type: 'A' };
        expect(() => Assert(schema, value)).toThrow(InvalidParameter);
        // Check error message
        try {
            Assert(schema, value);
        } catch (e) {
            expect(e.message).toEqual(
                'Invalid parameter "type" (= "A"): Expected string length greater or equal to 3',
            );
        }
    });
});
