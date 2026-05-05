import { type TradingTypeWithConcierge } from '@suite-common/trading';
import { useTranslate } from '@suite-native/intl';
import { WarningCard } from '@suite-native/trading-atoms';
import { exhaustive } from '@trezor/type-utils';

export type TradingTypeDisabledProps = {
    tradingType: TradingTypeWithConcierge;
};

const useTitle = (tradingType: TradingTypeWithConcierge) => {
    const { translate } = useTranslate();
    let tradingTypeTitle: string;

    switch (tradingType) {
        case 'buy':
            tradingTypeTitle = translate('moduleTrading.tradingScreen.tabs.buy');
            break;

        case 'exchange':
            tradingTypeTitle = translate('moduleTrading.tradingScreen.tabs.exchange');
            break;

        case 'sell':
            tradingTypeTitle = translate('moduleTrading.tradingScreen.tabs.sell');
            break;

        case 'concierge':
            tradingTypeTitle = translate('moduleTrading.tradingScreen.tabs.concierge');
            break;

        default:
            return exhaustive(tradingType);
    }

    return translate('tradingAtoms.error.tradingTypeDisabledTitle', {
        tradingType: tradingTypeTitle,
    });
};

export const TradingTypeDisabled = ({ tradingType }: TradingTypeDisabledProps) => {
    const title = useTitle(tradingType);

    return <WarningCard title={title} />;
};
