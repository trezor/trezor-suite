import * as yup from 'yup';

import { isAscii, isHex } from '@trezor/utils';

// Messages are translation keys; must be rendered via `Translation` / intl `translationString`.
// Maybe it could be centralized in @trezor/components, like suite-native has it in the `Input` atom?
yup.setLocale({
    string: {
        max: 'TR_EXCEEDS_MAX',
    },
    mixed: {
        required: 'TR_REQUIRED_FIELD',
    },
});

yup.addMethod<yup.StringSchema>(yup.string, 'isAscii', function () {
    return this.test('isAscii', 'TR_ASCII_ONLY', value => isAscii(value));
});

yup.addMethod<yup.StringSchema>(yup.string, 'isHex', function () {
    return this.test('isHex', 'DATA_NOT_VALID_HEX', value =>
        isHex(value, { prefix: 'optional', allowEmpty: false }),
    );
});

export { yup };
