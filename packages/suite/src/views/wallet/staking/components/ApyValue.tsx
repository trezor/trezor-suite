import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { isApyAvailable } from '@suite-common/wallet-utils';

interface ApyValueProps {
    apy?: number | null;
    isNotEarning?: boolean;
}

export const ApyValue = ({ apy, isNotEarning = false }: ApyValueProps) => {
    const { PercentageFormatter } = useFormatters();

    if (isNotEarning) {
        return <>{PercentageFormatter.format(0, { withSymbol: true })}</>;
    }

    if (apy == null || !isApyAvailable(apy)) {
        return <Translation id="TR_EARN_APY_N_A" />;
    }

    return <>~{PercentageFormatter.format(apy, { withSymbol: true })}</>;
};
