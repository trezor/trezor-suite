import { useMemo } from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type SpacingValuesNew } from '@trezor/theme';

import { type AssetLogoSize } from '../AssetLogo/AssetLogoWithId';
import { CoinLogo } from '../CoinLogo/CoinLogo';
import { IconSetBase, IconWrapper } from '../IconSet/IconSetBase';

export type NetworkIconSetProps = {
    networks: NetworkSymbol[];
    size: AssetLogoSize;
    gap: SpacingValuesNew;
    /** Maximum number of icons to show. When `undefined`, all icons are shown. @default 3 */
    maxVisibleIcons?: number;
    isCountVisible?: boolean;
    isCentered?: boolean;
};

export const NetworkIconSet = ({
    networks,
    size,
    gap,
    maxVisibleIcons,
    isCountVisible = false,
    isCentered = false,
}: NetworkIconSetProps) => {
    const { length } = networks;

    const visibleContent = useMemo(() => {
        const visibleNetworks =
            maxVisibleIcons !== undefined ? networks.slice(0, maxVisibleIcons) : networks;

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
        >
            {visibleContent}
        </IconSetBase>
    );
};
