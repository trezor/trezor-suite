import styled from 'styled-components';

import { Box, Image } from '@trezor/components';
import { borders, spacings } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';

const TradingIconWrapper = styled.div<{ $isDark: boolean }>`
    ${({ $isDark }) => $isDark && `background-color: #fff;`}
    border-radius: ${borders.radii.xxs};
`;

interface TradingIconProps {
    iconUrl: string;
}

export const TradingIcon = ({ iconUrl }: TradingIconProps) => {
    const currentTheme = useSelector(state => state.suite.settings.theme.variant);

    return (
        <TradingIconWrapper $isDark={currentTheme === 'dark'}>
            <Box margin={spacings.xxxs} height={20}>
                <Image imageSrc={iconUrl} width={20} alt="" />
            </Box>
        </TradingIconWrapper>
    );
};
