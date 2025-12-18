import { Box, Image } from '@trezor/components';

type TradingIconProps = {
    iconUrl: string;
};

export const TradingIcon = ({ iconUrl }: TradingIconProps) => (
    <Box height={20} borderRadius={4} backgroundColor="baseFillElementContrast">
        <Image imageSrc={iconUrl} height={20} alt="" />
    </Box>
);
