import { type AnalyticsDep, events } from '@suite-common/analytics';
import { createThunk } from '@suite-common/redux-utils';
import type { Explorer, NetworkSymbol } from '@suite-common/wallet-config';

import { EXPLORER_MODULE_PREFIX, explorerActions } from './explorerActions';
import { type ExplorerState } from './explorerReducer';
import { selectNetworkExplorerType } from './explorerSelectors';

type SetNetworkExplorerThunkDeps = {
    services: AnalyticsDep;
};
type SetNetworkExplorerThunkState = ExplorerState;
type SetNetworkExplorerThunkParams = {
    symbol: NetworkSymbol;
    explorer?: Explorer;
};

export const setNetworkExplorerThunk = createThunk<
    void,
    SetNetworkExplorerThunkParams,
    { state: SetNetworkExplorerThunkState; extra: SetNetworkExplorerThunkDeps }
>(`${EXPLORER_MODULE_PREFIX}/setExplorerThunk`, (payload, { dispatch, getState, extra }) => {
    dispatch(explorerActions.setExplorer(payload));
    extra.services.analytics.report({
        type: events.settingsNetworksExplorerEvent.name,
        payload: {
            networkSymbol: payload.symbol,
            type: selectNetworkExplorerType(getState(), payload.symbol),
        },
    });
});
