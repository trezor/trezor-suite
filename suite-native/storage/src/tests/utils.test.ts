import { filterObjectKeys } from '../transforms/utils';

describe('filterObjectKeys', () => {
    it('should filter out keys that are specified in the filterKeys array', () => {
        const obj = { apple: 1, banana: 2, apricot: 3, berry: 4, ananas: 5 };
        const filterKeys = ['ap', 'ana'];
        const expectedResult = { berry: 4 };
        const result = filterObjectKeys(obj, filterKeys);
        expect(result).toEqual(expectedResult);
    });

    it('should return the same object if no keys are filtered', () => {
        const obj = { apple: 1, banana: 2 };
        const filterKeys = ['orange'];
        const expectedResult = { apple: 1, banana: 2 };
        const result = filterObjectKeys(obj, filterKeys);
        expect(result).toEqual(expectedResult);
    });

    it('should return an empty object if all keys are filtered', () => {
        const obj = { apple: 1, apricot: 2 };
        const filterKeys = ['a'];
        const expectedResult = {};
        const result = filterObjectKeys(obj, filterKeys);
        expect(result).toEqual(expectedResult);
    });

    it('should return an empty object when filtering an empty object', () => {
        const obj = {};
        const filterKeys = ['a'];
        const expectedResult = {};
        const result = filterObjectKeys(obj, filterKeys);
        expect(result).toEqual(expectedResult);
    });

    it('should filter out account keys by device states', () => {
        const accountKeysMap = {
            'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT-btc-mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q@1632F3457D42E393B821ACC9:0':
                [1, 2, 3],
            'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT-btc-mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q@1632F3457D42E393B821ACC9:1':
                [4, 5, 6],
        };
        const deviceStates = [
            'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q@1632F3457D42E393B821ACC9:0',
            'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q@1632F3457D42E393B821ACC9:3',
        ];
        const expectedResult = {
            'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT-btc-mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q@1632F3457D42E393B821ACC9:1':
                [4, 5, 6],
        };
        const result = filterObjectKeys(accountKeysMap, deviceStates);
        expect(result).toEqual(expectedResult);
    });
});
