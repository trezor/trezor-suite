import { selectShouldAnimateLoadingSkeleton } from '@suite/ui-animations';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { isTestnet } from '@suite-common/wallet-utils';
import { Row, Skeleton } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

export function BalancePlaceholder() {
    const shouldAnimate = useSelector(selectShouldAnimateLoadingSkeleton);

    // Fills the 20px line of the loaded balance, so the row keeps its height once discovery ends.
    return <Skeleton width={100} height={16} margin={{ vertical: 2 }} animate={shouldAnimate} />;
}

type FiatBalancePlaceholderProps = {
    networkSymbol: NetworkSymbol;
};

export function FiatBalancePlaceholder({ networkSymbol }: FiatBalancePlaceholderProps) {
    const shouldAnimate = useSelector(selectShouldAnimateLoadingSkeleton);

    if (isTestnet(networkSymbol)) return null;

    return (
        <Row flex="none">
            <Skeleton width={48} height={16} animate={shouldAnimate} />
        </Row>
    );
}
