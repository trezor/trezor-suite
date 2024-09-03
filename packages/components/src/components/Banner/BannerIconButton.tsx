import { IconButton, IconButtonProps } from '../buttons/IconButton/IconButton';
import { useBannerContext, BannerContext } from './BannerContext';
import { DEFAULT_VARIANT } from './consts';

export const BannerIconButton = ({ icon, ...rest }: IconButtonProps) => {
    const { variant } = useBannerContext();
    const value = { variant: DEFAULT_VARIANT };

    return (
        <BannerContext.Provider value={value}>
            <IconButton
                icon={icon}
                {...rest}
                variant={rest.variant ?? variant}
                size={rest.size ?? 'small'}
            />
        </BannerContext.Provider>
    );
};
