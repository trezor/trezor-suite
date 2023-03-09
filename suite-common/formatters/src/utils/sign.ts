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

    return value.gte(0);
};
