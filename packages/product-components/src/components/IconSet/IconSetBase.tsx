import { type ReactNode } from 'react';

import styled, { css } from 'styled-components';

import { Text } from '@trezor/components';
import { type SpacingValuesNew, type TypographyStyle, borders } from '@trezor/theme';

import { type AssetLogoSize } from '../AssetLogo/AssetLogoWithId';

export const MAX_VISIBLE_ICONS = 3;

const mapSizeToTypographyStyle = (size: AssetLogoSize): TypographyStyle => {
    const typographyStyleMap: Record<AssetLogoSize, TypographyStyle> = {
        20: 'body-xs',
        24: 'body-sm',
        32: 'body-md',
        40: 'headline-sm',
    };

    return typographyStyleMap[size];
};

const Container = styled.div<{
    $length: number;
    $size: AssetLogoSize;
    $gap: SpacingValuesNew;
    $isCountVisible: boolean;
    $isCentered: boolean;
}>`
    justify-content: center;
    display: flex;
    align-items: center;

    ${({ $isCentered, $size, $gap, $length, $isCountVisible }) => {
        const visibleCount = $length > 3 ? 3 + Number($isCountVisible) : $length;

        return $isCentered
            ? css`
                  width: ${$size}px;
              `
            : css`
                  width: ${$size + (visibleCount - 1) * $gap}px;
              `;
    }}

    ${({ $length, $gap, $isCountVisible }) =>
        $length > 1 &&
        css`
            display: grid;
            grid-template-columns: repeat(
                ${$length > 3 ? 3 + Number($isCountVisible) : $length},
                ${$gap}px
            );
            justify-items: center;
        `}
`;

export const IconWrapper = styled.div<{ $size: number; $gap: number; $length: number }>`
    border-radius: ${borders.radii.full};

    ${({ $size, $gap, $length }) =>
        $length > 1 &&
        css`
            &:not(:last-child) {
                mask: radial-gradient(
                    circle at calc(50% + ${$gap}px) 50%,
                    transparent ${$size / 2 + 1}px,
                    black ${$size / 2 + 1}px
                );
            }
        `}
`;

const CountContainer = styled.div<{ $size: AssetLogoSize }>`
    ${({ $size }) => css`
        width: ${$size}px;
        height: ${$size}px;
    `}

    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: ${borders.radii.full};
    background: ${({ theme }) => theme.legacyBackgroundTertiaryDefaultOnElevationNegative};
`;

export type IconSetBaseProps = {
    count: number;
    size: AssetLogoSize;
    gap: SpacingValuesNew;
    isCountVisible?: boolean;
    isCentered?: boolean;
    children: ReactNode;
};

export const IconSetBase = ({
    count,
    size,
    gap,
    isCountVisible = false,
    isCentered = false,
    children,
}: IconSetBaseProps) => {
    if (count === 0) {
        return null;
    }

    return (
        <Container
            $length={count}
            $size={size}
            $gap={gap}
            $isCountVisible={isCountVisible}
            $isCentered={isCentered}
        >
            {children}
            {count > MAX_VISIBLE_ICONS && isCountVisible && (
                <CountContainer $size={size}>
                    <Text typographyStyle={mapSizeToTypographyStyle(size)} intent="neutral">
                        +{count - MAX_VISIBLE_ICONS}
                    </Text>
                </CountContainer>
            )}
        </Container>
    );
};
