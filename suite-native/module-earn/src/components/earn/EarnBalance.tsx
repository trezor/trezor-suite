import { useSelector } from 'react-redux';

import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import { BigNumber } from '@trezor/utils';

import {
    type EarnListRootState,
    selectEarnTotalFiatAmount,
    selectIsEarnFiatTotalIncomplete,
    selectIsEarnFiatTotalUnavailable,
} from '../../earnScreenSelectors';
import { useEarnMissingRateTickersQuery } from '../../hooks/earn/useEarnMissingRateTickersQuery';
import { useYieldOpportunities } from '../../hooks/yield/useYieldOpportunities';

export const EarnBalance = () => {
    const { isFiatRatesLoading } = useEarnMissingRateTickersQuery();
    const { yieldOpportunities } = useYieldOpportunities();

    const isFiatTotalIncomplete = useSelector((state: EarnListRootState) =>
        selectIsEarnFiatTotalIncomplete(state, yieldOpportunities, isFiatRatesLoading),
    );

    const isFiatTotalUnavailable = useSelector((state: EarnListRootState) =>
        selectIsEarnFiatTotalUnavailable(state, yieldOpportunities, isFiatRatesLoading),
    );

    const totalEarnFiatAmount = useSelector((state: EarnListRootState) =>
        selectEarnTotalFiatAmount(state, yieldOpportunities),
    );

    return (
        <VStack spacing="sp2">
            <Text variant="body-md" color="contentSecondary">
                <Translation id="earn.earnScreen.depositsCard.title" />
            </Text>

            {isFiatTotalUnavailable ? (
                <Text variant="headline-md">
                    <Translation id="earn.notAvailableShort" />
                </Text>
            ) : (
                <HStack spacing="sp4" alignItems="center">
                    {isFiatTotalIncomplete && <Text variant="headline-md">~</Text>}
                    <BaseCurrencyAmountFormatter
                        value={asBaseCurrencyAmount(new BigNumber(totalEarnFiatAmount))}
                        variant="headline-md"
                        isDiscreetText={false}
                        isLoading={isFiatRatesLoading}
                    />
                </HStack>
            )}
        </VStack>
    );
};
