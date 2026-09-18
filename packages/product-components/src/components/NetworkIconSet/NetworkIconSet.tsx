import { useMemo } from 'react';

import { Tooltip } from '@trezor/components';

import type { NetworkParams } from '../../NetworkParams';
import { getNetworkOptions } from '../../utils/getNetworkOptions';
import { type CommonIconSetProps, IconSetBase, IconWrapper } from '../IconSet/IconSetBase';

export type NetworkIconSetProps = CommonIconSetProps &
    NetworkParams & {
        hasTooltip?: boolean;
    };

export const NetworkIconSet = ({
    networks,
    networkNamesMap,
    isToken,
    size,
    gap,
    maxVisibleIcons = 3,
    isCountVisible = false,
    isCentered = false,
    isReversed = true,
    hasTooltip = false,
}: NetworkIconSetProps) => {
    const { length } = networks;

    const visibleContent = useMemo(() => {
        const visibleNetworks =
            maxVisibleIcons !== null ? networks.slice(0, maxVisibleIcons) : networks;

        return getNetworkOptions({
            networks: visibleNetworks,
            networkNamesMap,
            iconSize: size,
            isToken,
        }).map(({ symbol, name, icon }) => (
            <IconWrapper key={symbol} $size={size} $gap={gap} $length={length}>
                <Tooltip content={name} isActive={hasTooltip}>
                    {icon}
                </Tooltip>
            </IconWrapper>
        ));
    }, [networks, networkNamesMap, isToken, maxVisibleIcons, size, gap, length, hasTooltip]);

    return (
        <IconSetBase
            count={length}
            size={size}
            gap={gap}
            maxVisibleIcons={maxVisibleIcons}
            isCountVisible={isCountVisible}
            isCentered={isCentered}
            isReversed={isReversed}
        >
            {visibleContent}
        </IconSetBase>
    );
};
