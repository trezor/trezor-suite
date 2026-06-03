import { type ReactNode } from 'react';

import styled from 'styled-components';

import { type NetworkIconSymbol } from '@suite-common/icons/src/iconSymbols';

import { NetworkIcon, type NetworkIconSize } from './NetworkIcon';

const NETWORK_ICON_BADGE_CUTOUT_SPACING = 2;
const MIN_NETWORK_ICON_BADGE_PARENT_SIZE = 24 as const satisfies NetworkIconSize;

type NetworkIconBadgeParentSize = Extract<NetworkIconSize, 24 | 32 | 40 | 48 | 64>;

export const shouldShowNetworkIconBadge = (
    parentSize: NetworkIconSize,
): parentSize is NetworkIconBadgeParentSize => parentSize >= MIN_NETWORK_ICON_BADGE_PARENT_SIZE;

const parentSizeToSize = {
    24: 8,
    32: 12,
    40: 16,
    48: 20,
    64: 24,
} as const satisfies Record<NetworkIconBadgeParentSize, NetworkIconSize>;

export const mapParentSizeToSize = (parentSize: NetworkIconBadgeParentSize): NetworkIconSize =>
    parentSizeToSize[parentSize];

const getRoundedRectPath = (offset: number, size: number, radius: number) =>
    [
        `M${offset + radius} ${offset}`,
        `H${offset + size - radius}`,
        `A${radius} ${radius} 0 0 1 ${offset + size} ${offset + radius}`,
        `V${offset + size - radius}`,
        `A${radius} ${radius} 0 0 1 ${offset + size - radius} ${offset + size}`,
        `H${offset + radius}`,
        `A${radius} ${radius} 0 0 1 ${offset} ${offset + size - radius}`,
        `V${offset + radius}`,
        `A${radius} ${radius} 0 0 1 ${offset + radius} ${offset}`,
        'Z',
    ].join(' ');

const getNetworkIconBadgeOuterSize = (iconSize: NetworkIconSize) =>
    iconSize + NETWORK_ICON_BADGE_CUTOUT_SPACING * 2;

const getCutoutMask = (parentSize: NetworkIconSize, iconSize: NetworkIconSize) => {
    const badgeOuterSize = getNetworkIconBadgeOuterSize(iconSize);
    const badgePosition = parentSize - badgeOuterSize + NETWORK_ICON_BADGE_CUTOUT_SPACING;
    const cutoutPath = getRoundedRectPath(badgePosition, badgeOuterSize, badgeOuterSize / 4);
    const maskPath = `M0 0H${parentSize}V${parentSize}H0Z ${cutoutPath}`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${parentSize}" height="${parentSize}" viewBox="0 0 ${parentSize} ${parentSize}"><path fill="black" fill-rule="evenodd" d="${maskPath}"/></svg>`;

    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
};

const Wrapper = styled.div<{ $parentSize: NetworkIconSize }>`
    position: relative;
    width: ${({ $parentSize }) => $parentSize}px;
    height: ${({ $parentSize }) => $parentSize}px;
`;

const MaskedContent = styled.div<{
    $parentSize: NetworkIconSize;
    $iconSize: NetworkIconSize;
}>`
    width: 100%;
    height: 100%;
    mask: ${({ $parentSize, $iconSize }) => getCutoutMask($parentSize, $iconSize)} 0 0 / 100% 100%
        no-repeat;
`;

const BadgeWrapper = styled.div<{ $iconSize: NetworkIconSize }>`
    position: absolute;
    right: 0;
    bottom: 0;
    display: flex;
    width: ${({ $iconSize }) => $iconSize}px;
    height: ${({ $iconSize }) => $iconSize}px;
    border-radius: 25%;
`;

type NetworkIconBadgeProps = {
    networkSymbol: NetworkIconSymbol;
    parentSize: NetworkIconSize;
    children: ReactNode;
    'data-testid'?: string;
};

export const NetworkIconBadge = ({
    networkSymbol,
    parentSize,
    children,
    'data-testid': dataTestId,
}: NetworkIconBadgeProps) => {
    if (!shouldShowNetworkIconBadge(parentSize)) {
        return children;
    }

    const size = mapParentSizeToSize(parentSize);

    return (
        <Wrapper $parentSize={parentSize} data-testid={dataTestId}>
            <MaskedContent $parentSize={parentSize} $iconSize={size}>
                {children}
            </MaskedContent>
            <BadgeWrapper $iconSize={size}>
                <NetworkIcon networkSymbol={networkSymbol} size={size} />
            </BadgeWrapper>
        </Wrapper>
    );
};
