import { Translation } from '@suite-native/intl';

import { TradingEmptyComponent } from '../TradingEmptyComponent';

export const TradeAssetsListEmptyComponent = () => (
    <TradingEmptyComponent
        title={<Translation id="moduleTrading.tradeableAssetsSheet.emptyTitle" />}
        description={<Translation id="moduleTrading.tradeableAssetsSheet.emptyDescription" />}
    />
);
