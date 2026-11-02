import { Translation } from '@suite/intl';
import { type PercentageFormatterDataContext, useFormatters } from '@suite-common/formatters';

export const useFormatApy = () => {
    const { PercentageFormatter } = useFormatters();

    return (apy?: number | null, dataContext?: PercentageFormatterDataContext) =>
        apy == null ? (
            <Translation id="TR_EARN_APY_N_A" />
        ) : (
            PercentageFormatter.format(apy, dataContext)
        );
};
