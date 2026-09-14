import { useMemo } from 'react';

import { type NetworkSymbol } from '@suite-common/icons';
import { Tooltip } from '@trezor/components';

import { type CommonIconSetProps, IconSetBase, IconWrapper } from '../IconSet/IconSetBase';
import { TokenIcon } from '../TokenIcon/TokenIcon';

export type NetworkIconSetProps = CommonIconSetProps & {
    networks: { symbol: NetworkSymbol; name: string }[];
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

        return visibleNetworks.map(({ symbol, name }) => (
            <IconWrapper key={symbol} $size={size} $gap={gap} $length={length}>
                <Tooltip content={name} isActive={hasTooltip}>
                    <TokenIcon size={size} symbol={symbol} />
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
