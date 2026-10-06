import { useMemo } from 'react';

import { Tooltip } from '@trezor/components';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { useNetworkDisplaySelector } from '../../network-display/NetworkDisplayProvider';
import { selectNetworkOptions } from '../../network-display/networkDisplaySelectors';
import { getNetworkIcons } from '../../utils/getNetworkIcons';
import { type CommonIconSetProps, IconSetBase, IconWrapper } from '../IconSet/IconSetBase';

export type NetworkIconSetProps = CommonIconSetProps & {
    networks?: readonly NetworkSymbol[];
    isToken?: boolean;
    hasTooltip?: boolean;
};

export const NetworkIconSet = ({
    networks,
    isToken = true,
    size,
    gap,
    maxVisibleIcons = 3,
    isCountVisible = false,
    isCentered = false,
    isReversed = true,
    hasTooltip = false,
}: NetworkIconSetProps) => {
    const networkOptions = useNetworkDisplaySelector(state =>
        selectNetworkOptions(state, networks),
    );
    const { length } = networkOptions;

    const visibleContent = useMemo(() => {
        const visibleNetworks =
            maxVisibleIcons !== null ? networkOptions.slice(0, maxVisibleIcons) : networkOptions;

        return getNetworkIcons({
            networks: visibleNetworks,
            iconSize: size,
            isToken,
        }).map(({ symbol, name, icon }) => (
            <IconWrapper key={symbol} $size={size} $gap={gap} $length={length}>
                <Tooltip content={name} isActive={hasTooltip}>
                    {icon}
                </Tooltip>
            </IconWrapper>
        ));
    }, [networkOptions, isToken, maxVisibleIcons, size, gap, length, hasTooltip]);

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
