import { type NetworkSymbol } from '@suite-common/wallet-config';
import { isTestnet } from '@suite-common/wallet-utils';
import { Column, SkeletonRectangle } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useLoadingSkeleton } from 'src/hooks/suite';

type BalancePlaceholderProps = {
    networkSymbol: NetworkSymbol;
};

export function BalancePlaceholder({ networkSymbol }: BalancePlaceholderProps) {
    const { shouldAnimate } = useLoadingSkeleton();

    return (
        <Column gap={spacings.xs}>
            <SkeletonRectangle width="100px" height="16px" animate={shouldAnimate} />

            {!isTestnet(networkSymbol) && (
                <SkeletonRectangle width="100px" height="16px" animate={shouldAnimate} />
            )}
        </Column>
    );
}
