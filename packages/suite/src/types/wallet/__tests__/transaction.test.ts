import { isTranslationKey } from '@suite/intl';
import { SUITE_PRECOMPOSE_ERRORS } from '@suite-common/wallet-types';

it.each(Object.values(SUITE_PRECOMPOSE_ERRORS))(
    'precomposed error %s should be translatable',
    error => {
        expect(isTranslationKey(error)).toBe(true);
    },
);
