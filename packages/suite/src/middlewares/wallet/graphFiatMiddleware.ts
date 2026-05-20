import { type MiddlewareAPI } from 'redux';

import { setBaseCurrency } from '@suite-common/wallet-core';

import { evictGraphFiatCurrenciesFromMemory } from 'src/actions/wallet/graphFiatActions';
import type { AppState, Dispatch, Action as SuiteAction } from 'src/types/suite';
import type { WalletAction } from 'src/types/wallet';

export const graphFiatMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: SuiteAction | WalletAction): SuiteAction | WalletAction => {
        next(action);

        if (setBaseCurrency.match(action)) {
            api.dispatch(
                evictGraphFiatCurrenciesFromMemory({
                    keepBaseCurrencyCode: action.payload.localCurrency,
                }),
            );
        }

        return action;
    };
