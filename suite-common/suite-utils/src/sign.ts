import BigNumber from 'bignumber.js';

import { SignValue } from '@suite-common/suite-types';

export const isSignValuePositive = (value: SignValue) => {
    if (!value) {
        return;
    }

    if (value === 'pos') {
        return true;
    }

    if (value === 'neg') {
        return false;
    }

    return new BigNumber(value).gte(0);
};
