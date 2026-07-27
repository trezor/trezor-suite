import { Image } from '@trezor/components';

type TradingIconProps = {
    iconUrl: string;
};

export const TradingIcon = ({ iconUrl }: TradingIconProps) => (
    <Image imageSrc={iconUrl} maxHeight={24} borderRadius={4} />
);
