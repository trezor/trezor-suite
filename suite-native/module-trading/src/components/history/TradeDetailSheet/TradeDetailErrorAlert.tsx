import { useSelector } from 'react-redux';

import {
    TradingRootState,
    TradingType,
    selectTradingProviderByNameAndTradeType,
} from '@suite-common/trading';
import { FullAlertBox } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';

type TradeDetailErrorAlertProps = {
    provider?: string;
    tradeType: TradingType;
};

export const TradeDetailErrorAlert = ({ provider, tradeType }: TradeDetailErrorAlertProps) => {
    const openLink = useOpenLink();
    const providerInfo = useSelector((state: TradingRootState) =>
        selectTradingProviderByNameAndTradeType(state, provider, tradeType),
    );
    const { translate } = useTranslate();

    const supportUrl = providerInfo?.supportUrl;

    const handleProviderSupportPress = supportUrl ? () => openLink(supportUrl) : undefined;

    return (
        <FullAlertBox
            title={translate('moduleTrading.tradeHistory.detail.errorAlert.title')}
            description={translate('moduleTrading.tradeHistory.detail.errorAlert.description')}
            iconName="warningCircle"
            primaryButtonLabel={
                supportUrl && translate('moduleTrading.tradeHistory.detail.errorAlert.button')
            }
            primaryButtonProps={{ viewLeft: 'arrowSquareOut' }}
            onPressPrimaryButton={handleProviderSupportPress}
            variant="critical"
        />
    );
};
