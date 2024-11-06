import React from 'react';

import styled from 'styled-components';

import { spacingsPx } from '@trezor/theme';

const Container = styled.div<{ $hasLeftAddon?: boolean }>`
    display: flex;
    justify-content: ${({ $hasLeftAddon }) => ($hasLeftAddon ? 'space-between' : 'flex-end')};
    align-items: flex-end;
    gap: ${spacingsPx.xs};
    min-height: 30px;
    padding-bottom: 6px;
`;

export const RightAddonWrapper = styled.div`
    display: flex;
    gap: 6px;
`;

export const RightAddon = styled.div`
    display: flex;
    align-items: center;
`;

export const HoverAddonRight = styled.div<{ $isVisible?: boolean }>`
    opacity: ${({ $isVisible }) => ($isVisible ? 1 : 0)};
    transition: opacity 0.1s ease-out;
`;

export const LeftAddon = styled.div`
    display: flex;
    align-items: center;
`;

interface TopAddonsProps {
    isHovered?: boolean;
    addonLeft?: React.ReactNode;
    addonRight?: React.ReactNode;
    hoverAddonRight?: React.ReactNode;
}

export const TopAddons = ({
    isHovered,
    addonLeft,
    addonRight,
    hoverAddonRight,
}: TopAddonsProps) => {
    const isWithTopLabel = addonLeft || addonRight || hoverAddonRight;

    const isWithRightLabel = addonRight || hoverAddonRight;

    if (!isWithTopLabel) {
        return null;
    }

    return (
        <Container $hasLeftAddon={!!addonLeft}>
            {addonLeft && <LeftAddon>{addonLeft}</LeftAddon>}
            {isWithRightLabel && (
                <RightAddonWrapper>
                    {hoverAddonRight && (
                        <HoverAddonRight $isVisible={isHovered}>{hoverAddonRight}</HoverAddonRight>
                    )}
                    {addonRight && <RightAddon>{addonRight}</RightAddon>}
                </RightAddonWrapper>
            )}
        </Container>
    );
};
