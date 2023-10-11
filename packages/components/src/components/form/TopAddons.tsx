import React from 'react';
import styled from 'styled-components';
import { spacingsPx } from '@trezor/theme';

const Container = styled.div`
    display: flex;
    justify-content: end;
    align-items: flex-end;
    gap: ${spacingsPx.xs};
    min-height: 30px;
    padding-bottom: 6px;
`;

export const HoverAddon = styled.div<{ isVisible?: boolean }>`
    opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
    transition: opacity 0.1s ease-out;
`;

export const RightAddon = styled.div`
    display: flex;
    align-items: center;
`;

interface TopAddonsProps {
    isHovered?: boolean;
    addonRight?: React.ReactNode;
    hoverAddon?: React.ReactNode;
}

export const TopAddons = ({ isHovered, addonRight, hoverAddon }: TopAddonsProps) => {
    const isWithTopLabel = hoverAddon || addonRight;

    if (!isWithTopLabel) {
        return null;
    }

    return (
        <Container>
            {hoverAddon && <HoverAddon isVisible={isHovered}>{hoverAddon}</HoverAddon>}
            {addonRight && <RightAddon>{addonRight}</RightAddon>}
        </Container>
    );
};
