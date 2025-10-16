import { BannerContext, useBannerContext } from './BannerContext';
import { BannerVariant } from './types';
import { NewButton, NewButtonProps } from '../buttons/NewButton/NewButton';

const mapVariantToIntent = (
    variant: BannerVariant | undefined,
): NonNullable<NewButtonProps['intent']> => {
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

export const BannerButton = ({ children, intent, size = 'small', ...rest }: NewButtonProps) => {
    const { variant: bannerVariant } = useBannerContext();
    const resolvedIntent = intent ?? mapVariantToIntent(bannerVariant);

    return (
        <BannerContext.Provider value={{ variant: bannerVariant }}>
            <NewButton intent={resolvedIntent} size={size} {...rest}>
                {children}
            </NewButton>
        </BannerContext.Provider>
    );
};
