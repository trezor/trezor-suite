import { Type, Assert } from '../src';

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
});
