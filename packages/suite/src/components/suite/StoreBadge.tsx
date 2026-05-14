import { useState } from 'react';

import styled, { useTheme } from 'styled-components';

import { Box, Image, Row } from '@trezor/components';

import { TrezorLink } from './TrezorLink';

type StoreBadgeProps = {
    url: string;
    image: 'APP_STORE' | 'PLAY_STORE';
    isHighlighted?: boolean;
    onClick?: () => void;
};

const ImageContainer = styled.div<{ $isDarkTheme: boolean }>`
    img {
        ${({ $isDarkTheme }) => ($isDarkTheme ? `filter: invert(1);` : '')}
    }
`;

export const StoreBadge = ({ url, image, isHighlighted, onClick }: StoreBadgeProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const theme = useTheme();
    const isDarkTheme = theme.variant === 'dark';

    const onMouseEnter = () => {
        setIsHovered(true);
    };
    const onMouseLeave = () => {
        setIsHovered(false);
    };
    const highlighted = isHighlighted !== undefined ? isHighlighted : isHovered;

    return (
        <TrezorLink href={url} onClick={onClick}>
            <Box
                opacity={highlighted ? 1 : 0.6}
                onMouseEnter={onMouseEnter}
                padding={{ vertical: 8, horizontal: 12 }}
                cursor="pointer"
                borderRadius={8}
                backgroundColor="elementFillNeutralSoft"
                onMouseLeave={onMouseLeave}
            >
                <ImageContainer $isDarkTheme={isDarkTheme}>
                    <Row alignItems="center">
                        <Image image={image} height={26} maxWidth="unset" />
                    </Row>
                </ImageContainer>
            </Box>
        </TrezorLink>
    );
};
