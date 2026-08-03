import { events } from '@suite-common/analytics';
import { type CommonServices, createThunk } from '@suite-common/redux-utils';
import type { Explorer, NetworkSymbol } from '@suite-common/wallet-config';

import { EXPLORER_MODULE_PREFIX, explorerActions } from './explorerActions';
import { type ExplorerState } from './explorerReducer';
import { selectNetworkExplorerType } from './explorerSelectors';

type SetNetworkExplorerThunkDeps = {
    services: Pick<CommonServices, 'analytics'>;
};

export const setNetworkExplorerThunk = createThunk<
    void,
    { symbol: NetworkSymbol; explorer?: Explorer },
    { state: ExplorerState; extra: SetNetworkExplorerThunkDeps }
>(
    `${EXPLORER_MODULE_PREFIX}/setExplorerThunk`,
    (payload: { symbol: NetworkSymbol; explorer?: Explorer }, { dispatch, getState, extra }) => {
        dispatch(explorerActions.setExplorer(payload));
        extra.services.analytics.report({
            type: events.settingsNetworksExplorerEvent.name,
            payload: {
                networkSymbol: payload.symbol,
                type: selectNetworkExplorerType(getState(), payload.symbol),
            },
        });
    },
);
