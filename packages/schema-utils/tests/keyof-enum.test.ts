import { Static, Type, Validate } from '../src';

describe('enum', () => {
    it('should work with keyof enum', () => {
        enum E {
            A = 'a',
            B = 'b',
        }
        const schema = Type.KeyOfEnum(E);
        type T = Static<typeof schema>;

        const x: T = 'A';
        expect(x).toEqual('A');

        // @ts-expect-error
        const y: T = 'C';
        expect(y).toEqual('C');

        expect(Validate(schema, 'A')).toBe(true);
        expect(Validate(schema, 'B')).toBe(true);
        expect(Validate(schema, 'C')).toBe(false);
    });

    it('should work with keyof enum with exclude', () => {
        enum E {
            A = 'a',
            B = 'b',
        }
        const schema = Type.KeyOfEnum(E);
        type T1 = Static<typeof schema>;
        const b: T1 = 'B';
        expect(b).toEqual('B');

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const excluded = Type.Exclude(schema, Type.Literal('B'));
        type T2 = Static<typeof excluded>;
        // @ts-expect-error
        const x: T2 = 'B';
        expect(x).toEqual('B');
    });

    it('should work with normal enum', () => {
        enum E {
            A = 'a',
            B = 'b',
        }
        const schema = Type.Enum(E);
        type T = Static<typeof schema>;

        const x: T = E.A;
        expect(x).toEqual('a');

        // @ts-expect-error
        const y: T = 'C';
        expect(y).toEqual('C');

        expect(Validate(schema, 'a')).toBe(true);
        expect(Validate(schema, 'b')).toBe(true);
    });
});
