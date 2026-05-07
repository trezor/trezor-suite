import { useMemo } from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type SpacingValuesNew } from '@trezor/theme';

import { type AssetLogoSize } from '../AssetLogo/AssetLogoWithId';
import { CoinLogo } from '../CoinLogo/CoinLogo';
import { IconSetBase, IconWrapper, MAX_VISIBLE_ICONS } from '../IconSet/IconSetBase';

export type NetworkIconSetProps = {
    networks: NetworkSymbol[];
    size: AssetLogoSize;
    gap: SpacingValuesNew;
    isCountVisible?: boolean;
    isCentered?: boolean;
};

export const NetworkIconSet = ({
    networks,
    size,
    gap,
    isCountVisible = false,
    isCentered = false,
}: NetworkIconSetProps) => {
    const { length } = networks;

    const visibleContent = useMemo(() => {
        const visibleNetworks = networks.slice(0, MAX_VISIBLE_ICONS);

        return visibleNetworks.map(network => (
            <IconWrapper key={network} $size={size} $gap={gap} $length={length}>
                <CoinLogo size={size} symbol={network} />
            </IconWrapper>
        ));
    }, [networks, size, gap, length]);

    return (
        <IconSetBase
            count={length}
            size={size}
            gap={gap}
            isCountVisible={isCountVisible}
            isCentered={isCentered}
        >
            {visibleContent}
        </IconSetBase>
    );
};
