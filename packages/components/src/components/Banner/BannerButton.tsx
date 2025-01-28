import { BannerContext, useBannerContext } from './BannerContext';
import { DEFAULT_VARIANT } from './consts';
import { Button, ButtonProps } from '../buttons/Button/Button';

export const BannerButton = ({ children, ...rest }: ButtonProps) => {
    const { variant } = useBannerContext();
    const value = { variant: DEFAULT_VARIANT };

    return (
        <BannerContext.Provider value={value}>
            <Button
                {...rest}
                textWrap={rest.textWrap ?? false}
                variant={rest.variant ?? variant}
                size={rest.size ?? 'small'}
            >
                {children}
            </Button>
        </BannerContext.Provider>
    );
};
