import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { isApyAvailable } from '@suite-common/wallet-utils';

interface ApyValueProps {
    apy?: number | null;
}

export const ApyValue = ({ apy }: ApyValueProps) => {
    const { PercentageFormatter } = useFormatters();

    if (apy == null || !isApyAvailable(apy)) {
        return <Translation id="TR_EARN_APY_N_A" />;
    }

    return <>~{PercentageFormatter.format(apy, { withSymbol: true })}</>;
};
