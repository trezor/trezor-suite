import { useSelector } from 'react-redux';

import { selectTradingBuyProviders } from '@suite-common/trading';
import { Text } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import { TradingBuyForm } from '../../types';
import { TradingOverviewRow } from '../general/TradingOverviewRow';

export type TradingProviderPickerProps = {
    form: TradingBuyForm;
};

const notImplementedCallback = () => {
    // eslint-disable-next-line no-console
    console.log('Not implemented');
};

export const TradingProviderPicker = ({ form }: TradingProviderPickerProps) => {
    const { translate } = useTranslate();
    const providers = useSelector(selectTradingBuyProviders);

    const provider = providers?.[form.watch('provider')];

    return (
        <TradingOverviewRow
            title={translate('moduleTrading.tradingScreen.provider')}
            onPress={notImplementedCallback}
            noBottomBorder
        >
            {provider ? (
                <Text
                    color="textSubdued"
                    variant="body"
                    accessibilityLabel={translate('moduleTrading.tradingScreen.selectedProvider')}
                >
                    {provider.companyName}
                </Text>
            ) : (
                <Text
                    color="textDisabled"
                    variant="body"
                    accessibilityLabel={translate('moduleTrading.tradingScreen.noProvider')}
                >
                    {translate('moduleTrading.notSelected')}
                </Text>
            )}
        </TradingOverviewRow>
    );
};
