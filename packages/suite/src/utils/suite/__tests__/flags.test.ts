import { isFlagPresent, addToFlags, HAS_EMAIL_FLAG, HAS_BOOKMARK_FLAG } from '../flags';

describe('flags utils', () => {
    it('should return bool indicating if flag is present for given number', () => {
        expect(isFlagPresent(HAS_EMAIL_FLAG, 0)).toEqual(false);
        expect(isFlagPresent(HAS_EMAIL_FLAG, 1)).toEqual(true);
        expect(isFlagPresent(HAS_EMAIL_FLAG, 2)).toEqual(false);
    });

    it('should add flag and return respective number', () => {
        expect(addToFlags(HAS_EMAIL_FLAG, 0)).toEqual(1);
        expect(addToFlags(HAS_BOOKMARK_FLAG, 0)).toEqual(2);
    });

    it('should combine two flags and return number', () => {
        expect(addToFlags(HAS_BOOKMARK_FLAG, addToFlags(HAS_EMAIL_FLAG, 0))).toEqual(3);
    });

    it('should set two flags and check each of them', () => {
        const flags = addToFlags(HAS_BOOKMARK_FLAG, addToFlags(HAS_EMAIL_FLAG, 0));
        expect(isFlagPresent(HAS_EMAIL_FLAG, flags)).toEqual(true);
        expect(isFlagPresent(HAS_EMAIL_FLAG, flags)).toEqual(true);
    });
});
