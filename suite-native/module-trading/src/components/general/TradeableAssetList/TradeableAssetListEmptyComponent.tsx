import { Translation } from '@suite-native/intl';
import { EmptyComponent } from '@suite-native/trading-atoms';

export const TradeableAssetListEmptyComponent = () => (
    <EmptyComponent
        title={<Translation id="moduleTrading.tradeableAssetsSheet.emptyTitle" />}
        description={<Translation id="moduleTrading.tradeableAssetsSheet.emptyDescription" />}
    />
);
