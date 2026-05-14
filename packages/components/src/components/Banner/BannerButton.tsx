import { useBannerContext } from './BannerContext';
import { Button, type ButtonProps } from '../buttons/Button/Button';

export const BannerButton = ({ children, intent, size = 'small', ...rest }: ButtonProps) => {
    const { intent: bannerIntent } = useBannerContext();

    return (
        <Button intent={intent ?? bannerIntent} size={size} {...rest}>
            {children}
        </Button>
    );
};
