import { useSelector } from 'react-redux';

import { selectTradingBuyIsLoading, selectTradingBuyProviders } from '@suite-common/trading';
import { Text } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import { useTradingBuyFormContext } from '../../hooks/useTradingBuyFormContext';
import { TradingOverviewRow } from '../general/TradingOverviewRow';
import { TradingOverviewValueSkeleton } from '../general/TradingOverviewValueSkeleton';

export const TradingProviderPicker = () => {
    const { translate } = useTranslate();
    const form = useTradingBuyFormContext();
    const providers = useSelector(selectTradingBuyProviders);
    const isLoading = useSelector(selectTradingBuyIsLoading);
    const providerKey = form.watch('provider');

    if (isLoading) {
        return (
            <TradingOverviewRow
                title={translate('moduleTrading.tradingScreen.provider')}
                noBottomBorder
                noCaret
            >
                <TradingOverviewValueSkeleton />
            </TradingOverviewRow>
        );
    }

    if (!providerKey || !providers || providers[providerKey] === undefined) {
        return null;
    }

    const { companyName } = providers[providerKey];

    return (
        <TradingOverviewRow
            title={translate('moduleTrading.tradingScreen.provider')}
            noBottomBorder
            noCaret
        >
            <Text
                color="textSubdued"
                variant="body"
                accessibilityLabel={translate('moduleTrading.tradingScreen.selectedProvider')}
            >
                {companyName}
            </Text>
        </TradingOverviewRow>
    );
};
