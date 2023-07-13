import { G } from '@mobily/ts-belt';

import { SignValue } from '@suite-common/suite-types';

export const isSignValuePositive = (value: SignValue) => {
    if (!value) {
        return;
    }

    if (value === 'positive') {
        return true;
    }

    if (value === 'negative') {
        return false;
    }

    if (G.isNumber(value)) {
        return value > 0;
    }

    return value.gte(0);
};
