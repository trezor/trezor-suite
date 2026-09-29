import { arrayPartition } from './arrayPartition';

describe('arrayPartition', () => {
    describe('partition of the array by condition', () => {
        it('partition array of objects', () => {
            const arrayOfObjects = [
                { value: true, name: 'a' },
                { value: true, name: 'b' },
                { value: false, name: 'c' },
                { value: true, name: 'd' },
                { value: false, name: 'e' },
            ];
            const partitionedObjects = arrayPartition(arrayOfObjects, element => element.value);
            const [truthy, falsy] = partitionedObjects;
            expect(arrayOfObjects.length).toEqual(truthy.length + falsy.length);
            expect(partitionedObjects).toStrictEqual([
                [
                    { value: true, name: 'a' },
                    { value: true, name: 'b' },
                    { value: true, name: 'd' },
                ],
                [
                    { value: false, name: 'c' },
                    { value: false, name: 'e' },
                ],
            ]);
        });

        it('partition array of numbers', () => {
            const arrayOfNumbers = [3, 1, 4, 5, 2, 1, 2];
            const partitionedNumbers = arrayPartition(arrayOfNumbers, element => element < 3);
            const [lessThanThree, fromThree] = partitionedNumbers;
            expect(arrayOfNumbers.length).toEqual(lessThanThree.length + fromThree.length);
            expect(partitionedNumbers).toStrictEqual([
                [1, 2, 1, 2],
                [3, 4, 5],
            ]);
        });

        it('partition array of strings', () => {
            const arrayOfStrings = ['a', 'b', 'c', 'd', 'e', 'a'];
            const partitionedStrings = arrayPartition(
                arrayOfStrings,
                element => element === 'a' || element === 'b',
            );
            const [abStrings, restOfStrings] = partitionedStrings;
            expect(arrayOfStrings.length).toEqual(abStrings.length + restOfStrings.length);
            expect(partitionedStrings).toStrictEqual([
                ['a', 'b', 'a'],
                ['c', 'd', 'e'],
            ]);
        });

        it('partition with type predicate', () => {
            const foobars = [{ foo: 1 }, { bar: 3 }, { bar: 2 }, { foo: 4 }];
            const isFoo = (item: (typeof foobars)[number]): item is { foo: number } =>
                'foo' in item;
            const [foos, bars] = arrayPartition(foobars, isFoo);
            expect(foos).toEqual([{ foo: 1 }, { foo: 4 }]);
            expect(bars).toEqual([{ bar: 3 }, { bar: 2 }]);
        });

        it('partition empty array', () => {
            expect(arrayPartition([], () => true)).toStrictEqual([[], []]);
        });

        it('partition when all elements pass', () => {
            const array = [1, 2, 3];
            const condition = jest.fn((element: number) => element > 0);
            const [pass, fail] = arrayPartition(array, condition);
            expect(pass).toStrictEqual([1, 2, 3]);
            expect(pass).not.toBe(array);
            expect(fail).toStrictEqual([]);
            expect(condition).toHaveBeenCalledTimes(3);
            expect(condition).toHaveBeenNthCalledWith(1, 1);
            expect(condition).toHaveBeenNthCalledWith(2, 2);
            expect(condition).toHaveBeenNthCalledWith(3, 3);
        });

        it('partition when all elements fail', () => {
            const array = [1, 2, 3];
            const condition = jest.fn((element: number) => element < 0);
            const [pass, fail] = arrayPartition(array, condition);
            expect(pass).toStrictEqual([]);
            expect(fail).toStrictEqual([1, 2, 3]);
            expect(fail).not.toBe(array);
            expect(condition).toHaveBeenCalledTimes(3);
            expect(condition).toHaveBeenNthCalledWith(1, 1);
            expect(condition).toHaveBeenNthCalledWith(2, 2);
            expect(condition).toHaveBeenNthCalledWith(3, 3);
        });
    });
});
