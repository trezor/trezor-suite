import { type WithServices, createThunk } from '@suite-common/redux-utils';

import { type GetTradingEnvironment } from './loadInitialDataThunk';
import { TRADING_THUNK_PREFIX } from '../../constants';
import { tradingExchangeActions } from '../../reducers/exchangeReducer';
import { type TradingRootState, tradingActions } from '../../reducers/tradingCommonReducer';
import { selectTradingExchangeInfo, selectTradingInfo } from '../../selectors/tradingSelectors';
import { tradeApi } from '../../tradeApi';
import { createRandomTradingRequestIdentity } from '../../utils/apiKeyUtils';
import { getExchangeInfo } from '../exchange/loadExchangeInfoThunk';

type LoadAssetCatalogResult = { success: true };
type LoadAssetCatalogError = { error: 'catalog-unavailable' };

export type LoadAssetCatalogThunkState = TradingRootState;

export type LoadAssetCatalogThunkDeps = WithServices<{
    getTradingEnvironment: GetTradingEnvironment;
}>;

export const loadAssetCatalogThunk = createThunk<
    LoadAssetCatalogResult,
    void,
    {
        state: LoadAssetCatalogThunkState;
        extra: LoadAssetCatalogThunkDeps;
        rejectValue: LoadAssetCatalogError;
    }
>(`${TRADING_THUNK_PREFIX}/loadAssetCatalog`, async (_, thunkApi) => {
    const { dispatch, extra, getState, rejectWithValue, signal } = thunkApi;
    const currentInfo = selectTradingInfo(getState());
    const currentExchangeInfo = selectTradingExchangeInfo(getState());
    const hasInfo = currentInfo.coins !== undefined && currentInfo.platforms !== undefined;
    const hasExchangeInfo = currentExchangeInfo !== undefined;

    if (hasInfo && hasExchangeInfo) {
        return { success: true };
    }

    const tradeServerEnvironment = extra.services.getTradingEnvironment();
    if (tradeServerEnvironment) {
        tradeApi.setServersEnvironment(tradeServerEnvironment);
    }

    const identity = createRandomTradingRequestIdentity();
    const [loadedInfo, loadedExchangeList] = await Promise.all([
        hasInfo ? undefined : tradeApi.getInfo({ identity, signal }),
        hasExchangeInfo ? undefined : tradeApi.getExchangeList({ identity, signal }),
    ]);
    const exchangeInfo = loadedExchangeList ? getExchangeInfo(loadedExchangeList) : undefined;
    const hasLoadedInfo =
        loadedInfo !== undefined && Object.keys(loadedInfo.coins ?? {}).length > 0;
    const hasLoadedExchangeInfo =
        exchangeInfo !== undefined && exchangeInfo.buyCryptoIds.length > 0;

    if ((!hasInfo && !hasLoadedInfo) || (!hasExchangeInfo && !hasLoadedExchangeInfo)) {
        return rejectWithValue({ error: 'catalog-unavailable' });
    }

    if (loadedInfo !== undefined) {
        dispatch(tradingActions.saveInfo(loadedInfo));
    }

    if (exchangeInfo !== undefined) {
        dispatch(tradingExchangeActions.saveExchangeInfo(exchangeInfo));
    }

    return { success: true };
});
