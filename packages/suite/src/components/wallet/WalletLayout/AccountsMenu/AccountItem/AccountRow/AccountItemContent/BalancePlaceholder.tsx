import { selectShouldAnimateLoadingSkeleton } from '@suite/ui-animations';
import { useSelector } from '@suite-common/redux-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { isTestnet } from '@suite-common/wallet-utils';
import { Column, Skeleton } from '@trezor/components';
type BalancePlaceholderProps = {
    networkSymbol: NetworkSymbol;
};

export function BalancePlaceholder({ networkSymbol }: BalancePlaceholderProps) {
    const shouldAnimate = useSelector(selectShouldAnimateLoadingSkeleton);

    return (
        <Column gap={8}>
            <Skeleton width={100} height={16} animate={shouldAnimate} />

            {!isTestnet(networkSymbol) && (
                <Skeleton width={100} height={16} animate={shouldAnimate} />
            )}
        </Column>
    );
}
