import { useMemo } from 'react';

import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { Tooltip } from '@trezor/components';

import { CoinLogo } from '../CoinLogo/CoinLogo';
import { type CommonIconSetProps, IconSetBase, IconWrapper } from '../IconSet/IconSetBase';

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
    const { length } = networks;

    const visibleContent = useMemo(() => {
        const visibleNetworks =
            maxVisibleIcons !== null ? networks.slice(0, maxVisibleIcons) : networks;

        return visibleNetworks.map(network => (
            <IconWrapper key={network} $size={size} $gap={gap} $length={length}>
                <Tooltip content={getNetwork(network).name} isActive={hasTooltip}>
                    <CoinLogo size={size} symbol={network} />
                </Tooltip>
            </IconWrapper>
        ));
    }, [networks, maxVisibleIcons, size, gap, length, hasTooltip]);

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
