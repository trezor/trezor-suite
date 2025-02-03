import { Route } from '@suite-common/suite-types/src/route';
import { Account, SelectedAccountStatus } from '@suite-common/wallet-types';
import { AddressDisplayOptions } from '@suite-common/wallet-types/src/settings';

import type { TradingState } from '../reducers/tradingReducer';
import { InvityServerEnvironment } from '../types';

// partial copy of Suite state
export type TradingRootState = {
    wallet: {
        selectedAccount: SelectedAccountStatus;
        accounts: Account[];
        trading: TradingState;
    };
    suite: {
        settings: {
            addressDisplayType: AddressDisplayOptions;
            debug: {
                invityServerEnvironment: InvityServerEnvironment;
            };
        };
    };
    router: {
        url: string;
        pathname: string;
        route: {
            name: Route['name'];
        };
    };
};

export const selectState = (state: TradingRootState) => state;
