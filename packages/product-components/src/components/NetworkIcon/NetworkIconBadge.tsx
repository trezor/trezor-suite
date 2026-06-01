import styled from 'styled-components';

import { type NetworkIconSymbol } from '@suite-common/icons';
import { roundTo } from '@trezor/utils';

import { NetworkIcon } from './NetworkIcon';

const NETWORK_ICON_BADGE_RATIO = 0.375;
const NETWORK_ICON_BADGE_PADDING = 1;

const getNetworkIconBadgeSize = (size: number) => roundTo(size * NETWORK_ICON_BADGE_RATIO, 2);

const BadgeWrapper = styled.div<{ $iconSize: number }>`
    position: absolute;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    width: ${({ $iconSize }) => $iconSize + NETWORK_ICON_BADGE_PADDING * 2}px;
    height: ${({ $iconSize }) => $iconSize + NETWORK_ICON_BADGE_PADDING * 2}px;
    padding: ${NETWORK_ICON_BADGE_PADDING}px;
    border-radius: 25%;
    background-color: ${({ theme }) => theme.legacyBackgroundTertiaryDefaultOnElevation0};
    line-height: 0;
`;

type NetworkIconBadgeProps = {
    networkSymbol: NetworkIconSymbol;
    parentSize: number;
};

export const NetworkIconBadge = ({ networkSymbol, parentSize }: NetworkIconBadgeProps) => {
    const size = getNetworkIconBadgeSize(parentSize);

    return (
        <BadgeWrapper $iconSize={size}>
            <NetworkIcon networkSymbol={networkSymbol} size={size} />
        </BadgeWrapper>
    );
};
