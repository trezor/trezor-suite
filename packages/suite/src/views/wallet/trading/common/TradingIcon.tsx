import { Image } from '@trezor/components';
import { borders } from '@trezor/theme';

type TradingIconProps = {
    iconUrl: string;
};

export const TradingIcon = ({ iconUrl }: TradingIconProps) => (
    <Image imageSrc={iconUrl} maxHeight={24} borderRadius={borders.radii.xxxs} />
);
