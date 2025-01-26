import styled from 'styled-components';

import { Box, iconSizes, Image } from '@trezor/components';
import { borders, spacings } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';

const CoinmarketIconWrapper = styled.div<{ $isDark: boolean }>`
    ${({ $isDark }) => $isDark && `background-color: #fff;`}
    border-radius: ${borders.radii.xxs};
`;

interface CoinmarketIconProps {
    iconUrl: string;
}

export const CoinmarketIcon = ({ iconUrl }: CoinmarketIconProps) => {
    const currentTheme = useSelector(state => state.suite.settings.theme.variant);

    return (
        <CoinmarketIconWrapper $isDark={currentTheme === 'dark'}>
            <Box margin={spacings.xxxs} height={iconSizes.mediumLarge}>
                <Image imageSrc={iconUrl} width={iconSizes.mediumLarge} alt="" />
            </Box>
        </CoinmarketIconWrapper>
    );
};
