import { mergeObj } from '../mergeObj';

describe('mergeObj', () => {
    it('should deep merge two objects', () => {
        const target = {
            a: 1,
            b: {
                a: 1,
            },
        };
        const source = {
            c: {
                a: 1,
            },
        };
        const expected = {
            a: 1,
            b: {
                a: 1,
            },
            c: {
                a: 1,
            },
        };
        expect(mergeObj(target, source)).toEqual(expected);
    });
});
