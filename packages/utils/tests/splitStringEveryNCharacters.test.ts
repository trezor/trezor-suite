import { splitStringEveryNCharacters } from '../src/splitStringEveryNCharacters';

describe(splitStringEveryNCharacters.name, () => {
    it('splits string into parts of N characters', () => {
        expect(splitStringEveryNCharacters('123456789', 0)).toStrictEqual([]);

        const expectedFor1 = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
        expect(splitStringEveryNCharacters('123456789', 1)).toStrictEqual(expectedFor1);

        const expectedFor2 = ['12', '34', '56', '78', '9'];
        expect(splitStringEveryNCharacters('123456789', 2)).toStrictEqual(expectedFor2);
    });
});
