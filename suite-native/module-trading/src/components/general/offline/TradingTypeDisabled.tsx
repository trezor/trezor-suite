import { TradingType } from '@suite-common/trading';
import { useTranslate } from '@suite-native/intl';
import { exhaustive } from '@trezor/type-utils';

import { OfflineCard } from './OfflineCard';

export type TradingTypeDisabledProps = {
    tradingType: TradingType;
};

const useTitle = (tradingType: TradingType) => {
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

        default:
            return exhaustive(tradingType);
    }

    return translate('moduleTrading.error.tradingTypeDisabledTitle', {
        tradingType: tradingTypeTitle,
    });
};

export const TradingTypeDisabled = ({ tradingType }: TradingTypeDisabledProps) => {
    const title = useTitle(tradingType);

    return <OfflineCard title={title} />;
};
