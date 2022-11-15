import { getKeyByValue, getValueByKey } from '../src/enumUtils';

enum NumberEnum {
    ZERO,
    ONE,
}

enum StringEnum {
    ZERO = '0',
    ONE = '1',
}

describe('enumUtils', () => {
    it('getKeyByValue', () => {
        expect(getKeyByValue(NumberEnum, 0)).toEqual('ZERO');
        expect(getKeyByValue(NumberEnum, 1)).toEqual('ONE');
        // @ts-expect-error string value should not be accepted
        expect(getKeyByValue(NumberEnum, '1')).toBeUndefined();

        expect(getKeyByValue(StringEnum, StringEnum.ZERO)).toEqual('ZERO');
        // @ts-expect-error number value should not be accepted
        expect(getKeyByValue(StringEnum, 1)).toBeUndefined();
    });

    it('getValueByKey', () => {
        expect(getValueByKey(NumberEnum, 'ONE')).toEqual(1);
        // @ts-expect-error number value should not be accepted
        expect(getValueByKey(NumberEnum, 1)).toBeUndefined();
        // @ts-expect-error not a key
        expect(getValueByKey(NumberEnum, '2')).toBeUndefined();

        expect(getValueByKey(StringEnum, 'ONE')).toEqual('1');
        // @ts-expect-error not a key
        expect(getValueByKey(StringEnum, '0')).toBeUndefined();
    });
});
