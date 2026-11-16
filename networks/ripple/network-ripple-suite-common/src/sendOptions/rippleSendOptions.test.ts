import { rippleSendLabels, validateDestinationTag } from './rippleSendOptions';

describe(validateDestinationTag.name, () => {
    it.each(['0', '1', '4294967295'])('accepts %s', value => {
        expect(validateDestinationTag(value)).toBeUndefined();
    });

    it('refuses an empty tag, since one that is turned on must be set', () => {
        expect(validateDestinationTag('')).toBe(rippleSendLabels.notSet);
    });

    it.each(['abc', ' '])('says %p is not a number', value => {
        expect(validateDestinationTag(value)).toBe(rippleSendLabels.notNumber);
    });

    it.each(['4294967296', '-1', '1.5', '01'])('says %s is not a valid tag', value => {
        expect(validateDestinationTag(value)).toBe(rippleSendLabels.notValid);
    });
});
