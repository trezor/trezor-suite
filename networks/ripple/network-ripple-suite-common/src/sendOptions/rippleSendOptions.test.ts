import { rippleSendLabels, validateDestinationTag } from './rippleSendOptions';

describe(validateDestinationTag.name, () => {
    it.each(['0', '1', '4294967295'])('accepts %s', value => {
        expect(validateDestinationTag(value)).toBeUndefined();
    });

    it.each(['abc', ' ', ''])('says %p is not a number', value => {
        expect(validateDestinationTag(value)).toBe(rippleSendLabels.notNumber);
    });

    it.each(['4294967296', '-1', '1.5', '01'])('says %s is not a valid tag', value => {
        expect(validateDestinationTag(value)).toBe(rippleSendLabels.notValid);
    });
});
