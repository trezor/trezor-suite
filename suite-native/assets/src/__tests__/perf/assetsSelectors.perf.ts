import { Reassure } from '@suite-native/test-utils';

import {
    selectAssetsFiatValuePercentage,
    selectDeviceAssetsWithBalances,
} from '../../assetsSelectors';
import { assetsSelectorFixture } from './fixtures/assetsSelectorFixture';

describe('@suite-native/assets - selectors:', () => {
    it('selectDeviceAssetsWithBalances', () => {
        Reassure.measureFunction(() => {
            selectDeviceAssetsWithBalances(assetsSelectorFixture);
        });
    });

    it('selectAssetsFiatValuePercentage', () => {
        Reassure.measureFunction(() => {
            selectAssetsFiatValuePercentage(assetsSelectorFixture);
        });
    });
});
