import { networksActions } from '@suite-common/networks';
import { mockNetworkConfigDeps } from '@suite-common/networks/mocks';
import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { asTimestamp } from '@suite-common/wallet-types';

import { prepareFiatRatesReducer } from './fiatRatesReducer';
import { updateFiatRatesThunk } from './fiatRatesThunks';

it('uses loaded network metadata to exclude testnet fiat rates', () => {
    const reducer = prepareFiatRatesReducer({
        actionTypes: { storageLoad: mockActionType('storageLoad') },
        reducers: { storageLoadHistoricRates: mockReducer() },
    });
    const config = mockNetworkConfigDeps().getNetworkConfig('btc');
    const payload: Parameters<typeof updateFiatRatesThunk>[0] = {
        tickers: [{ symbol: 'btc' }],
        baseCurrencyCode: 'usd',
        fetchAttemptTimestamp: asTimestamp(1000),
        rateType: 'current',
    };
    const pending = updateFiatRatesThunk.pending('request', payload);
    const testnetState = reducer(
        undefined,
        networksActions.setNetworks([{ ...config, testnet: true }]),
    );

    expect(reducer(testnetState, pending).current).toEqual({});

    const mainnetState = reducer(testnetState, networksActions.setNetworks([config]));
    expect(Object.values(reducer(mainnetState, pending).current)).toEqual([
        expect.objectContaining({ isLoading: true, ticker: { symbol: 'btc' } }),
    ]);
});
