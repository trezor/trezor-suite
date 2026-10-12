import { InvalidParameter } from './errors';

import { Assert, Type } from './index';

describe('number-autocast', () => {
    it('should string to number if needed', () => {
        const schema = Type.Object({
            number: Type.Number(),
            nested: Type.Object({
                number: Type.Number(),
            }),
        });

        const input = {
            number: '1',
            nested: {
                number: '1',
            },
        };

        Assert(schema, input);
        expect(input.number).toEqual(1);
        expect(input.nested.number).toEqual(1);
    });

    it('should not autocast a value under a key that setDeepValue does not follow', () => {
        const schema = Type.Record(Type.String(), Type.Number());
        // JSON.parse creates "__proto__" as an own key.
        const input = JSON.parse('{"__proto__":"1"}');

        expect(() => Assert(schema, input)).toThrow(InvalidParameter);
    });
});
