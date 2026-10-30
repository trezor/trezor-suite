import { useSelector } from 'react-redux';

import {
    type EarnListRootState,
    selectIsEarnFiatTotalIncomplete,
    useEarnMissingRateTickersQuery,
    useYieldOpportunities,
} from '@suite-common/wallet-core';
import { BannerInline } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const EarnBalanceIncompleteFiatBanner = () => {
    const { yieldOpportunities } = useYieldOpportunities();
    const { isFiatRatesLoading, onRetry } = useEarnMissingRateTickersQuery();

    const isFiatTotalIncomplete = useSelector((state: EarnListRootState) =>
        selectIsEarnFiatTotalIncomplete(state, yieldOpportunities, isFiatRatesLoading),
    );

    if (!isFiatTotalIncomplete) return null;

    return (
        <BannerInline
            testID="@earn/balance-card/incomplete-fiat-total"
            intent="warning"
            title={<Translation id="earn.earnScreen.depositsCard.incompleteFiatTotal" />}
            buttonLabel={<Translation id="generic.buttons.retry" />}
            buttonProps={{ priority: 'secondary' }}
            onButtonPress={onRetry}
        />
    );
};
