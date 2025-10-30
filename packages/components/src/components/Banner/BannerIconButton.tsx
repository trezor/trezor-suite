import { BannerContext, useBannerContext } from './BannerContext';
import { DEFAULT_VARIANT } from './consts';
import { NewIconButton, NewIconButtonProps } from '../buttons/NewIconButton/NewIconButton';

const mapVariantToIconIntent = (variant: string): NewIconButtonProps['intent'] => {
    switch (variant) {
        case 'info':
            return 'info';
        case 'warning':
            return 'warning';
        case 'destructive':
            return 'critical';
        case 'tertiary':
            return 'neutral';
        default:
            return 'brand';
    }
};

export const BannerIconButton = ({
    icon,
    isSubtle,
    ...rest
}: NewIconButtonProps & { isSubtle?: boolean }) => {
    const { variant } = useBannerContext();
    const value = { variant: DEFAULT_VARIANT };
    const resolvedIntent = rest.intent ?? mapVariantToIconIntent(variant || DEFAULT_VARIANT);
    const resolvedPriority =
        rest.priority ?? (variant === 'tertiary' || isSubtle ? 'secondary' : 'primary');

    return (
        <BannerContext.Provider value={value}>
            <NewIconButton
                icon={icon}
                {...rest}
                intent={resolvedIntent}
                priority={resolvedPriority}
                size={rest.size ?? 'small'}
            />
        </BannerContext.Provider>
    );
};
