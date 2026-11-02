import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { Tooltip } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { type NetworkConfigState, type NetworkSymbol } from '@trezor/network-module-types';

import { selectNetworkOptions } from '../../network-display/networkDisplaySelectors';
import { injectHasNetworkIcon } from '../../services/networkServices';
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
    const { hasNetworkIcon } = useServices(injectHasNetworkIcon);
    const networkOptions = useSelector((state: NetworkConfigState) =>
        selectNetworkOptions(state, networks),
    );
    const { length } = networkOptions;

    const visibleContent = useMemo(() => {
        const visibleNetworks =
            maxVisibleIcons !== null ? networkOptions.slice(0, maxVisibleIcons) : networkOptions;

        return getNetworkIcons(
            { hasNetworkIcon },
            {
                networks: visibleNetworks,
                iconSize: size,
                isToken,
            },
        ).map(({ symbol, name, icon }) => (
            <IconWrapper key={symbol} $size={size} $gap={gap} $length={length}>
                <Tooltip content={name} isActive={hasTooltip}>
                    {icon}
                </Tooltip>
            </IconWrapper>
        ));
    }, [hasNetworkIcon, networkOptions, isToken, maxVisibleIcons, size, gap, length, hasTooltip]);

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
