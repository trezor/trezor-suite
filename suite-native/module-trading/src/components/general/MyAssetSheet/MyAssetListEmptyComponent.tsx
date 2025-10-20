import { Translation } from '@suite-native/intl';
import { EmptyComponent } from '@suite-native/trading-atoms';

export const MyAssetListEmptyComponent = () => (
    <EmptyComponent
        title={<Translation id="moduleTrading.myAssetSheet.emptyTitle" />}
        description={<Translation id="moduleTrading.myAssetSheet.emptyDescription" />}
    />
);
