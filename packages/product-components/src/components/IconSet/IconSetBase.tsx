import { Children, type ReactNode } from 'react';

import styled, { css } from 'styled-components';

import { Text } from '@trezor/components';
import { type SpacingValue, type TypographyStyle } from '@trezor/theme';

import { type TokenIconSize } from '../TokenIcon/tokenIconTypes';

const mapSizeToTypographyStyle = (size: TokenIconSize): TypographyStyle => {
    const typographyStyleMap: Record<TokenIconSize, TypographyStyle> = {
        16: 'body-xs',
        20: 'body-xs',
        24: 'body-xs',
        32: 'body-sm',
        40: 'body-md',
        48: 'body-md',
        64: 'body-md',
    };

    return typographyStyleMap[size];
};

const Container = styled.div<{
    $length: number;
    $size: TokenIconSize;
    $gap: SpacingValue;
    $maxVisibleIcons: number;
    $isCountVisible: boolean;
    $isCentered: boolean;
}>`
    justify-content: center;
    display: flex;
    align-items: center;
    filter: drop-shadow(0 2px 2px ${({ theme }) => theme.shadowKeyElevated})
        drop-shadow(0 0 2px ${({ theme }) => theme.shadowAmbientElevated});

    ${({ $isCentered, $size, $gap, $length, $maxVisibleIcons, $isCountVisible }) => {
        const visibleCount =
            $length > $maxVisibleIcons ? $maxVisibleIcons + Number($isCountVisible) : $length;

        return $isCentered
            ? css`
                  width: ${$size}px;
              `
            : css`
                  width: ${$size + (visibleCount - 1) * $gap}px;
              `;
    }}

    ${({ $length, $gap, $maxVisibleIcons, $isCountVisible }) =>
        $length > 1 &&
        css`
            display: grid;
            grid-template-columns: repeat(
                ${
                    $length > $maxVisibleIcons
                        ? $maxVisibleIcons + Number($isCountVisible)
                        : $length
                },
                ${$gap}px
            );
            justify-items: center;
        `}
`;

const overlappingIconStyles = ($size: number, $gap: number, $length: number) =>
    $length > 1 &&
    css`
        height: ${$size}px;

        &:not(:first-child) {
            mask: radial-gradient(
                circle at calc(50% - ${$gap}px) 50%,
                transparent ${$size / 2 + 1.5}px,
                black ${$size / 2 + 1.5}px
            );
        }
    `;

export const IconWrapper = styled.div<{ $size: number; $gap: number; $length: number }>`
    border-radius: calc(infinity * 1px);

    ${({ $size, $gap, $length }) => overlappingIconStyles($size, $gap, $length)}
`;

const CountContainer = styled.div<{
    $size: TokenIconSize;
    $gap: SpacingValue;
    $length: number;
}>`
    ${({ $size }) => css`
        min-width: ${$size}px;
        height: ${$size}px;
    `}

    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: ${({ $size }) => $size / 2}px;
    background: ${({ theme }) => theme.elementFillNeutralSofter};

    ${({ $size, $gap, $length }) => overlappingIconStyles($size, $gap, $length)}
`;

export type CommonIconSetProps = {
    size: TokenIconSize;
    gap: SpacingValue;
    /** Maximum number of icons to show. When `null`, all icons are shown. @default 3 */
    maxVisibleIcons?: number | null;
    isCountVisible?: boolean;
    isCentered?: boolean;
    isReversed?: boolean;
};

export type IconSetBaseProps = CommonIconSetProps & {
    count: number;
    children: ReactNode;
};

export const IconSetBase = ({
    count,
    size,
    gap,
    maxVisibleIcons = 3,
    isCountVisible = false,
    isCentered = false,
    isReversed = false,
    children,
}: IconSetBaseProps) => {
    const effectiveMaxVisibleIcons = maxVisibleIcons ?? count;

    if (count === 0) {
        return null;
    }

    const childrenArray = Children.toArray(children);
    const orderedChildren = isReversed ? childrenArray.reverse() : childrenArray;

    return (
        <Container
            $length={count}
            $size={size}
            $gap={gap}
            $maxVisibleIcons={effectiveMaxVisibleIcons}
            $isCountVisible={isCountVisible}
            $isCentered={isCentered}
        >
            {orderedChildren}
            {count > effectiveMaxVisibleIcons && isCountVisible && (
                <CountContainer $size={size} $gap={gap} $length={count}>
                    <Text
                        typographyStyle={mapSizeToTypographyStyle(size)}
                        intent="neutral"
                        priority="secondary"
                    >
                        +{count - effectiveMaxVisibleIcons}
                    </Text>
                </CountContainer>
            )}
        </Container>
    );
};
