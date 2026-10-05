import { type WithServices, createThunk } from '@suite-common/redux-utils';

import * as storageActions from 'src/actions/suite/storageActions';
import { type AssetTableRootState, assetTableActions } from 'src/reducers/suite/assetTableReducer';
import { type DbDep } from 'src/storage/createDb';

const ASSET_TABLE_PREFIX = '@suite/assetTable';

type DismissNewAssetTableBannerThunkState = AssetTableRootState;

type DismissNewAssetTableBannerThunkDeps = WithServices<DbDep>;

export const dismissNewAssetTableBannerThunk = createThunk<
    void,
    void,
    {
        state: DismissNewAssetTableBannerThunkState;
        extra: DismissNewAssetTableBannerThunkDeps;
    }
>(`${ASSET_TABLE_PREFIX}/dismissNewBanner`, async (_, { dispatch }) => {
    dispatch(assetTableActions.dismissNewBanner());

    await dispatch(storageActions.saveAssetTableThunk());
});
