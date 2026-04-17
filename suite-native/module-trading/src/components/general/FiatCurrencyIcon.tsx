import { RoundedIcon, type RoundedIconSize } from '@suite-native/atoms';

export type FiatCurrencyIconProps = {
    size: 'extraSmall' | 'small' | 'medium';
};

const fiatIconSizes: Record<FiatCurrencyIconProps['size'], RoundedIconSize> = {
    extraSmall: 20,
    small: 32,
    medium: 48,
};

export const FiatCurrencyIcon = ({ size }: FiatCurrencyIconProps) => (
    <RoundedIcon name="coin" intent="neutral" size={fiatIconSizes[size]} />
);
