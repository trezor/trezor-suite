import { Translation } from '@suite-native/intl';

import { TradingEmptyComponent } from '../EmptyComponent';

export const TradeAssetsListEmptyComponent = () => (
    <TradingEmptyComponent
        title={<Translation id="moduleTrading.tradeableAssetsSheet.emptyTitle" />}
        description={<Translation id="moduleTrading.tradeableAssetsSheet.emptyDescription" />}
    />
);
