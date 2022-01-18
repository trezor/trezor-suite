import { getNumberFromPxString } from '../src/getNumberFromPxString';

it('getNumberFromPxString', () => {
    expect(getNumberFromPxString('1px')).toBe(1);
    expect(getNumberFromPxString('1')).toBe(1);
});
