import { isCountryCode } from './countries';

describe(isCountryCode.name, () => {
    it.each(['US', 'XX', 'T1'])('accepts %s', code => {
        expect(isCountryCode(code)).toBe(true);
    });

    it.each(['INVALID', 'ZZ', '', 'toString'])('rejects %j', code => {
        expect(isCountryCode(code)).toBe(false);
    });
});
