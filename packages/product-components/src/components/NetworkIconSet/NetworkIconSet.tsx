import { useMemo } from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';

import { CoinLogo } from '../CoinLogo/CoinLogo';
import { type CommonIconSetProps, IconSetBase, IconWrapper } from '../IconSet/IconSetBase';

export type NetworkIconSetProps = CommonIconSetProps & {
    networks: NetworkSymbol[];
};

export const NetworkIconSet = ({
    networks,
    size,
    gap,
    maxVisibleIcons = 3,
    isCountVisible = false,
    isCentered = false,
    isReversed = true,
}: NetworkIconSetProps) => {
    const { length } = networks;

    const visibleContent = useMemo(() => {
        const visibleNetworks =
            maxVisibleIcons !== null ? networks.slice(0, maxVisibleIcons) : networks;

        return visibleNetworks.map(network => (
            <IconWrapper key={network} $size={size} $gap={gap} $length={length}>
                <CoinLogo size={size} symbol={network} />
            </IconWrapper>
        ));
    }, [networks, maxVisibleIcons, size, gap, length]);

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
