import { getNumberFromPixelString } from '../src/getNumberFromPixelString';

it('getNumberFromPixelString', () => {
    expect(getNumberFromPixelString('1px')).toBe(1);
    expect(getNumberFromPixelString('1')).toBe(1);
});
