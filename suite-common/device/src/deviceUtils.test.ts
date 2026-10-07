import { mockSuiteDevice } from '@suite-common/suite-types/mocks';

import { PASSPHRASE_MAX_LENGTH } from './deviceConstants';
import { getIsPassphraseTooLong, getPassphraseMaxLength } from './deviceUtils';

describe(getPassphraseMaxLength.name, () => {
    it('returns the passphrase limit reported by the device', () => {
        const device = mockSuiteDevice({}, { max_passphrase_len: 128 });

        expect(getPassphraseMaxLength(device)).toBe(128);
    });

    it('falls back to the default limit when the device does not report one', () => {
        const device = mockSuiteDevice({}, { max_passphrase_len: undefined });

        expect(getPassphraseMaxLength(device)).toBe(PASSPHRASE_MAX_LENGTH);
    });

    it('falls back to the default limit when there is no device', () => {
        expect(getPassphraseMaxLength(undefined)).toBe(PASSPHRASE_MAX_LENGTH);
    });
});

describe(getIsPassphraseTooLong.name, () => {
    it('allows a passphrase exactly at the limit', () => {
        expect(getIsPassphraseTooLong('a'.repeat(128), 128)).toBe(false);
    });

    it('rejects a passphrase over the limit', () => {
        expect(getIsPassphraseTooLong('a'.repeat(129), 128)).toBe(true);
    });

    it('counts multi-byte characters by their UTF-8 byte length', () => {
        expect(getIsPassphraseTooLong('č'.repeat(25), 50)).toBe(false);
        expect(getIsPassphraseTooLong('č'.repeat(26), 50)).toBe(true);
    });
});
