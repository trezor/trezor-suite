import * as yup from 'yup';

import { type TxKeyPath } from '@suite-native/intl';

yup.setLocale({
    mixed: {
        required: 'forms.errors.mixed.required',
    },
    string: {
        max: 'forms.errors.string.max',
    },
} satisfies Record<string, Record<string, TxKeyPath>>);

export { yup };
