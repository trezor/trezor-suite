import { Type, Validate } from '../src';

describe('type-guard', () => {
    it('guard works when parsing unknown value', () => {
        const schema = Type.Object({
            foo: Type.String(),
        });

        const unknown = JSON.parse('{"foo": "bar"}') as unknown;

        // @ts-expect-error
        expect(unknown.foo).toBe('bar');

        expect(Validate(schema, unknown)).toBe(true);
        if (Validate(schema, unknown)) {
            // @ts-expect-no-error
            expect(unknown.foo).toBe('bar');
        }
    });
});
