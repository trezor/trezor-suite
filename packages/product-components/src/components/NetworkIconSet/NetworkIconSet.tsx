import { useMemo } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { selectNetworkConfigDeps } from '@suite-common/networks';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { Tooltip } from '@trezor/components';

import { type CommonIconSetProps, IconSetBase, IconWrapper } from '../IconSet/IconSetBase';
import { TokenIcon } from '../TokenIcon/TokenIcon';

export type NetworkIconSetProps = CommonIconSetProps & {
    networks: NetworkSymbol[];
    hasTooltip?: boolean;
};

export const NetworkIconSet = ({
    networks,
    size,
    gap,
    maxVisibleIcons = 3,
    isCountVisible = false,
    isCentered = false,
    isReversed = true,
    hasTooltip = false,
}: NetworkIconSetProps) => {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);

    const { length } = networks;

    const visibleContent = useMemo(() => {
        const visibleNetworks =
            maxVisibleIcons !== null ? networks.slice(0, maxVisibleIcons) : networks;

        return visibleNetworks.map(network => (
            <IconWrapper key={network} $size={size} $gap={gap} $length={length}>
                <Tooltip
                    content={getNetwork(networkConfigDeps, network).name}
                    isActive={hasTooltip}
                >
                    <TokenIcon size={size} symbol={network} />
                </Tooltip>
            </IconWrapper>
        ));
    }, [networkConfigDeps, networks, maxVisibleIcons, size, gap, length, hasTooltip]);

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
