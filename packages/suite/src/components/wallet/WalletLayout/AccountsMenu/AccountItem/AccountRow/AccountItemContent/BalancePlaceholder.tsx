import { selectShouldAnimateLoadingSkeleton } from '@suite/ui-animations';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { isTestnet } from '@suite-common/wallet-utils';
import { Column, Skeleton } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';

type BalancePlaceholderProps = {
    networkSymbol: NetworkSymbol;
};

export function BalancePlaceholder({ networkSymbol }: BalancePlaceholderProps) {
    const shouldAnimate = useSelector(selectShouldAnimateLoadingSkeleton);

    return (
        <Column gap={spacings.xs}>
            <Skeleton width={100} height={16} animate={shouldAnimate} />

            {!isTestnet(networkSymbol) && (
                <Skeleton width={100} height={16} animate={shouldAnimate} />
            )}
        </Column>
    );
}
