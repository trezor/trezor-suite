import { SignValue } from '@suite-common/suite-types';

import { makeFormatter } from '../makeFormatter';
import { isSignValuePositive } from '../utils/sign';

export const SignValueFormatter = makeFormatter<SignValue | undefined, string>(value =>
    value ? `${isSignValuePositive(value) ? '+' : '-'}` : '',
);
