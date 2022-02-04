import { objectPartition } from '../src/objectPartition';

describe('objectPartition', () => {
    it('two parts', () => {
        const object = {
            a: 1,
            b: 2,
            c: 3,
            d: 4,
            e: 5,
        };
        const partitioned = objectPartition(object, ['a', 'c', 'd']);
        expect(partitioned).toStrictEqual([
            {
                a: 1,
                c: 3,
                d: 4,
            },
            {
                b: 2,
                e: 5,
            },
        ]);
    });
    it('take everything', () => {
        const object = {
            a: 1,
            b: 2,
            c: 3,
        };
        const partitioned = objectPartition(object, ['a', 'c', 'b']);
        expect(partitioned).toStrictEqual([object, {}]);
    });
});
