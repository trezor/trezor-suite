import { RoundedIcon } from '@suite-native/atoms';

export type FiatCurrencyIconProps = {
    size: 'small' | 'medium';
};

export const FiatCurrencyIcon = ({ size }: FiatCurrencyIconProps) => {
    const containerSize = size === 'small' ? 24 : 32;

    return (
        <RoundedIcon
            name="coin"
            color="iconSubdued"
            iconSize={size}
            containerSize={containerSize}
            backgroundColor="backgroundSurfaceElevation0"
        />
    );
};
