import { type WithServices, createThunk } from '@suite-common/redux-utils';

import * as storageActions from 'src/actions/suite/storageActions';
import { type AssetTableRootState, assetTableActions } from 'src/reducers/suite/assetTableReducer';
import { type DbDep } from 'src/storage/createDb';

const ASSET_TABLE_PREFIX = '@suite/assetTable';

type ShowSmallBalancesThunkProps = { areShown: boolean };

type ShowSmallBalancesThunkState = AssetTableRootState;

type ShowSmallBalancesThunkDeps = WithServices<DbDep>;

/** What the asset table shows of small balances, remembered for the next run. */
export const showSmallBalancesThunk = createThunk<
    void,
    ShowSmallBalancesThunkProps,
    { state: ShowSmallBalancesThunkState; extra: ShowSmallBalancesThunkDeps }
>(`${ASSET_TABLE_PREFIX}/showSmallBalances`, async ({ areShown }, { dispatch }) => {
    dispatch(assetTableActions.showSmallBalances(areShown));

    await dispatch(storageActions.saveAssetTableThunk());
});

type DismissNewAssetTableBannerThunkState = AssetTableRootState;

type DismissNewAssetTableBannerThunkDeps = WithServices<DbDep>;

/** The banner saying the table is new, taken down for good. */
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
