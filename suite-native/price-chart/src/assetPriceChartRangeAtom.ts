import {
    type AssetPriceChartRange,
    INITIAL_ASSET_PRICE_CHART_RANGE,
} from '@suite-common/price-chart';
import { atomWithUnecryptedStorage } from '@suite-native/storage';

export const assetPriceChartRangeAtom = atomWithUnecryptedStorage<AssetPriceChartRange>(
    'assetPriceChartRange',
    INITIAL_ASSET_PRICE_CHART_RANGE,
);
