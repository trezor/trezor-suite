import { type QueryClientDep } from '@suite-common/react-query';
import { type SelectedAccountStatus } from '@suite-common/wallet-types';
import { type WithServices, createThunk } from '@trezor/redux-utils';

import { type SetTradeApiKeyThunkState, setTradeApiKeyThunk } from './setTradeApiKeyThunk';
import {
    TRADING_SECTION_CATALOGS,
    type TradingCatalog,
    loadTradingCatalog,
} from './tradingCatalogs';
import { TRADING_ANONYMOUS_ID, TRADING_THUNK_PREFIX } from '../../constants';
import { tradingActions } from '../../reducers/tradingCommonReducer';
import {
    type TradingRootStateWithAccounts,
    selectTradeApiKeyAccount,
} from '../../selectors/tradingSelectors';
import { tradeApi } from '../../tradeApi';
import { type TradeServerEnvironment, type TradingType } from '../../types';

export interface LoadInitialDataThunkProps {
    activeSection: TradingType;
    /**
     * The catalogs the caller reads, by default those of `activeSection` in `TRADING_SECTION_CATALOGS`.
     * The coin info and the swap catalog are megabytes each, so only their readers load them.
     */
    catalogs?: readonly TradingCatalog[];
    forcedAnonymousId?: string;
    forceReload?: boolean;
}

export type LoadInitialDataThunkState = TradingRootStateWithAccounts & SetTradeApiKeyThunkState;

export type LoadInitialDataThunkDeps = WithServices<
    QueryClientDep & {
        getSelectedAccount: () => SelectedAccountStatus;
        getTradingEnvironment: GetTradingEnvironment;
    }
>;

export type GetTradingEnvironment = () => TradeServerEnvironment | undefined;

export const loadInitialDataThunk = createThunk<
    void,
    LoadInitialDataThunkProps,
    { state: LoadInitialDataThunkState; extra: LoadInitialDataThunkDeps }
>(
    `${TRADING_THUNK_PREFIX}/loadInitialData`,
    async (
        {
            activeSection,
            catalogs = TRADING_SECTION_CATALOGS[activeSection],
            forcedAnonymousId,
            forceReload = false,
        },
        { dispatch, getState, extra },
    ) => {
        const { queryClient } = extra.services;
        const account = selectTradeApiKeyAccount(
            getState(),
            activeSection,
            extra.services.getSelectedAccount(),
        );

        dispatch(tradingActions.setTradingActiveSection(activeSection));

        if (account || activeSection === 'buy') {
            dispatch(setTradeApiKeyThunk({ account }));
        } else {
            tradeApi.createAnonymousApiKey(forcedAnonymousId || TRADING_ANONYMOUS_ID);
        }

        const tradeServerEnvironment = extra.services.getTradingEnvironment();
        if (tradeServerEnvironment) {
            tradeApi.setServersEnvironment(tradeServerEnvironment);
        }

        await Promise.all(
            catalogs.map(catalog =>
                loadTradingCatalog(catalog, { dispatch, queryClient, forceReload }),
            ),
        );
    },
);
