import { BannerContext, useBannerContext } from './BannerContext';
import { BannerVariant } from './types';
import { Button, ButtonProps } from '../buttons/Button/Button';

const mapVariantToIntent = (
    variant: BannerVariant | undefined,
): NonNullable<ButtonProps['intent']> => {
    switch (variant) {
        case 'info':
            return 'info';
        case 'warning':
            return 'warning';
        case 'destructive':
            return 'critical';
        case 'tertiary':
            return 'neutral';
        case 'primary':
        default:
            return 'brand';
    }
};

export const BannerButton = ({ children, intent, size = 'small', ...rest }: ButtonProps) => {
    const { variant: bannerVariant } = useBannerContext();
    const resolvedIntent = intent ?? mapVariantToIntent(bannerVariant);

    return (
        <BannerContext.Provider value={{ variant: bannerVariant }}>
            <Button intent={resolvedIntent} size={size} {...rest}>
                {children}
            </Button>
        </BannerContext.Provider>
    );
};
