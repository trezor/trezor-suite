import { RoundedIcon } from '@suite-native/atoms';

export type FiatCurrencyIconProps = {
    size: 'extraSmall' | 'small' | 'medium';
};

const fiatIconSizes = {
    extraSmall: 16,
    small: 32,
    medium: 48,
} as const;

export const FiatCurrencyIcon = ({ size }: FiatCurrencyIconProps) => {
    const containerSize = fiatIconSizes[size];

    return (
        <RoundedIcon
            name="coin"
            color="contentSecondary"
            iconSize={size}
            containerSize={containerSize}
            backgroundColor="surfaceFillPage"
        />
    );
};
