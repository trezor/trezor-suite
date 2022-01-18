import { arrayPartition } from '../src/arrayPartition';

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
    });
});
