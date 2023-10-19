import { SignValue } from '@suite-common/suite-types';

import { makeFormatter } from '../makeFormatter';
import { isSignValuePositive } from '../utils/sign';

// NOTE: No need for config so this formatter is exported directly without prepare function.
export const SignValueFormatter = makeFormatter<SignValue | undefined, string>(
    value => (value ? `${isSignValuePositive(value) ? '+' : '-'}` : ''),
    'SignValueFormatter',
);
