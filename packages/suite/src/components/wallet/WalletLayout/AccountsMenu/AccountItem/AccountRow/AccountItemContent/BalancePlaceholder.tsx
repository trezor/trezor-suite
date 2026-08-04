import { selectShouldAnimateLoadingSkeleton } from '@suite/ui-animations';
import { useServices } from '@suite-common/dependency-injection';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectNetworkConfigDeps } from '@suite-common/wallet-config';
import { isTestnet } from '@suite-common/wallet-utils';
import { Column, Skeleton } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

type BalancePlaceholderProps = {
    networkSymbol: NetworkSymbol;
};

export function BalancePlaceholder({ networkSymbol }: BalancePlaceholderProps) {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);
    const shouldAnimate = useSelector(selectShouldAnimateLoadingSkeleton);

    return (
        <Column gap={8}>
            <Skeleton width={100} height={16} animate={shouldAnimate} />

            {!isTestnet(networkConfigDeps, networkSymbol) && (
                <Skeleton width={100} height={16} animate={shouldAnimate} />
            )}
        </Column>
    );
}
