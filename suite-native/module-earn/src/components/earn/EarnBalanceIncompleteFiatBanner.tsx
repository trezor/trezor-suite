import { useSelector } from 'react-redux';

import { BannerInline } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { type EarnListRootState, selectIsEarnFiatTotalIncomplete } from '../../earnScreenSelectors';
import { useEarnMissingRateTickersQuery } from '../../hooks/earn/useEarnMissingRateTickersQuery';
import { useYieldOpportunities } from '../../hooks/yield/useYieldOpportunities';

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
