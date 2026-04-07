import { useState } from 'react';

import { Box, Image, Row } from '@trezor/components';

import { TrezorLink } from './TrezorLink';

type StoreBadgeProps = {
    url: string;
    image: 'APP_STORE' | 'PLAY_STORE';
    isHighlighted?: boolean;
    onClick?: () => void;
};

export const StoreBadge = ({ url, image, isHighlighted, onClick }: StoreBadgeProps) => {
    const [isHovered, setIsHovered] = useState(false);

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
                <Row alignItems="center">
                    <Image image={image} height={26} maxWidth="unset" />
                </Row>
            </Box>
        </TrezorLink>
    );
};
