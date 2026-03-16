import { useBannerContext } from './BannerContext';
import { IconButton, type IconButtonProps } from '../buttons/IconButton/IconButton';

export const BannerIconButton = ({ intent, size = 'small', ...rest }: IconButtonProps) => {
    const { intent: bannerIntent } = useBannerContext();

    return <IconButton intent={intent ?? bannerIntent} size={size} {...rest} />;
};
