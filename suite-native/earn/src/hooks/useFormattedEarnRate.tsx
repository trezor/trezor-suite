import { type PercentageFormatterDataContext, useFormatters } from '@suite-common/formatters';
import { isApyAvailable } from '@suite-common/wallet-utils';
import { useTranslate } from '@suite-native/intl';

export const useFormattedEarnRate = (
    rate: number | null | undefined,
    dataContext?: PercentageFormatterDataContext,
) => {
    const { translate } = useTranslate();
    const { PercentageFormatter } = useFormatters();

    if (!rate || !isApyAvailable(rate)) {
        return translate('earn.notAvailableShort');
    }

    return PercentageFormatter.format(rate, dataContext);
};
