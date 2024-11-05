import React from 'react';

import styled from 'styled-components';

import { spacings } from '@trezor/theme';

import { Row } from '../Flex/Flex';

export const HoverAddonRight = styled.div<{ $isVisible?: boolean }>`
    opacity: ${({ $isVisible }) => ($isVisible ? 1 : 0)};
    transition: opacity 0.1s ease-out;
`;

type TopAddonsProps = {
    isHovered?: boolean;
    addonLeft?: React.ReactNode;
    addonRight?: React.ReactNode;
    hoverAddonRight?: React.ReactNode;
};

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
        <Row
            gap={spacings.xs}
            alignItems="flex-end"
            justifyContent={addonLeft ? 'space-between' : 'flex-end'}
        >
            {addonLeft && <Row>{addonLeft}</Row>}
            {isWithRightLabel && (
                <Row gap={spacings.xxs}>
                    {hoverAddonRight && (
                        <HoverAddonRight $isVisible={isHovered}>{hoverAddonRight}</HoverAddonRight>
                    )}
                    {addonRight && <Row>{addonRight}</Row>}
                </Row>
            )}
        </Row>
    );
};
