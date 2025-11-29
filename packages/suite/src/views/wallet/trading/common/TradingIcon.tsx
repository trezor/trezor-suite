import { useTheme } from 'styled-components';

import { Box, Image } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

type TradingIconProps = {
    iconUrl: string;
};

export const TradingIcon = ({ iconUrl }: TradingIconProps) => {
    const theme = useTheme();
    const currentTheme = useSelector(state => state.suite.settings.theme.variant);

    return (
        <Box
            height={20}
            borderRadius={4}
            backgroundColor={
                currentTheme === 'dark' ? theme.backgroundSurfaceElevation2 : undefined
            }
        >
            <Image imageSrc={iconUrl} height={20} alt="" />
        </Box>
    );
};
