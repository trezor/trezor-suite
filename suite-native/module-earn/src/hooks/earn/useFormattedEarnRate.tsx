import { isApyAvailable } from '@suite-common/wallet-utils';
import { useTranslate } from '@suite-native/intl';

export const useFormattedEarnRate = (rate: number | null | undefined) => {
    const { translate } = useTranslate();

    if (!rate || !isApyAvailable(rate)) {
        return translate('earn.notAvailableShort');
    }

    return rate.toFixed(2);
};
