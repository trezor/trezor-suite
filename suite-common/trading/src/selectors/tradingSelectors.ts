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
};

export const selectTradingLoadingAndTimestamp = (state: TradingRootState) => ({
    isLoading: state.wallet.trading.isLoading,
    lastLoadedTimestamp: state.wallet.trading.lastLoadedTimestamp,
});

export const selectTradingInfo = (state: TradingRootState) => state.wallet.trading.info;

export const selectTradingBuy = (state: TradingRootState) => state.wallet.trading.buy;

export const selectTradingSelectedAccount = (state: TradingRootState) =>
    state.wallet.selectedAccount;

export const selectTradingSettingEnviroment = (state: TradingRootState) =>
    state.suite.settings.debug.invityServerEnvironment;

export const selectTradingSettingAddressDisplayType = (state: TradingRootState) =>
    state.suite.settings.addressDisplayType;
