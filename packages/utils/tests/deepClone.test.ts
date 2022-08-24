import { deepClone } from '../src/deepClone';

describe('deepClone', () => {
    it('deepClone works', () => {
        const original = {
            a: 1,
            b: '2',
            c: {
                a: 1,
                b: '2',
                c: {
                    a: [1, 2, 3],
                    b: '2',
                },
            },
        };

        const copy = deepClone(original);
        const shallowCopy = { ...original };

        expect(copy.c.c.a === original.c.c.a).toBeFalsy();
        expect(shallowCopy.c.c.a === original.c.c.a).toBeTruthy();
    });
});
