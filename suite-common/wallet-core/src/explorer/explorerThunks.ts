import { type AnalyticsDep, events } from '@suite-common/analytics';
import type { Explorer, NetworkSymbol } from '@suite-common/wallet-config';
import { type WithServices, createThunk } from '@trezor/redux-utils';

import { EXPLORER_MODULE_PREFIX, explorerActions } from './explorerActions';
import { type ExplorerState } from './explorerReducer';
import { selectNetworkExplorerType } from './explorerSelectors';

type SetNetworkExplorerThunkParams = {
    symbol: NetworkSymbol;
    explorer?: Explorer;
};

type SetNetworkExplorerThunkState = ExplorerState;

type SetNetworkExplorerThunkDeps = WithServices<AnalyticsDep>;

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
