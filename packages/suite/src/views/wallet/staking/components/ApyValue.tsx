import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { isApyAvailable } from '@suite-common/wallet-utils';

interface ApyValueProps {
    apy?: number | null;
}

export const ApyValue = ({ apy }: ApyValueProps) => {
    const { PercentageFormatter } = useFormatters();

    if (apy == null || (apy !== 0 && !isApyAvailable(apy))) {
        return <Translation id="TR_EARN_APY_N_A" />;
    }

    return (
        <>
            {apy !== 0 && '~'}
            {PercentageFormatter.format(apy, { withSymbol: true })}
        </>
    );
};
