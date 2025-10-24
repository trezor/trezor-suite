import { useState } from 'react';

import styled from 'styled-components';

import { Image } from '@trezor/components';

import { TrezorLink } from './TrezorLink';
const BadgeContainer = styled.div<{ $isHighlighted: boolean }>`
    opacity: ${({ $isHighlighted }) => ($isHighlighted ? 1 : 0.6)};
    transition: opacity 0.3s;
    cursor: pointer;
    display: flex;
    align-items: center;
`;

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

    return (
        <TrezorLink href={url} variant="nostyle" onClick={onClick}>
            <BadgeContainer
                $isHighlighted={isHighlighted !== undefined ? isHighlighted : isHovered}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
            >
                <Image image={`${image}_BADGE`} height={35} maxWidth="unset" />
            </BadgeContainer>
        </TrezorLink>
    );
};
