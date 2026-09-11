import type { FiatCurrencyCode } from 'invity-api';

import { getFiatCurrencyFlag } from '@suite-common/flags';
import { Flag, type IconCircleSize } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';

export type FiatCurrencyIconProps = {
    size: 'extraSmall' | 'small' | 'medium' | 24;
    value?: FiatCurrencyCode;
};

const fiatIconSizes: Record<Exclude<FiatCurrencyIconProps['size'], number>, IconCircleSize> = {
    extraSmall: 20,
    small: 32,
    medium: 40,
};

export const FiatCurrencyIcon = ({ size, value }: FiatCurrencyIconProps) => {
    const flag = getFiatCurrencyFlag(value);
    const iconSize = typeof size === 'number' ? size : fiatIconSizes[size];

    return flag ? (
        <Flag country={flag} size={iconSize} />
    ) : (
        <Icon
            name="coin"
            size={iconSize}
            color="contentSecondary"
            testID="@trading/fiat-currency-icon-fallback"
        />
    );
};
