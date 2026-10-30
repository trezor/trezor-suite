import { type Dispatch } from '@reduxjs/toolkit';

import { type Account } from '@suite-common/wallet-types';
import { createThunk } from '@trezor/redux-utils';

import { TRADING_THUNK_PREFIX } from '../../constants';
import { type TradingRootState, tradingActions } from '../../reducers/tradingCommonReducer';
import {
    selectTradeApiDeviceSalt,
    selectTradeApiInstallSalt,
} from '../../selectors/tradingSelectors';
import { tradeApi } from '../../tradeApi';
import {
    createInstallTradeApiKey,
    createSaltedTradeApiKey,
    generateTradeApiInstallSalt,
} from '../../utils/tradeApiSaltUtils';

type TradeApiKeyAccount = Pick<Account, 'descriptor' | 'deviceState'>;

type TradeApiKeyThunkParams = {
    account: TradeApiKeyAccount | undefined;
};

export const resolveTradeApiKey = (
    account: TradeApiKeyAccount | undefined,
    dispatch: Dispatch,
    getState: () => TradingRootState,
) => {
    const storedInstallSalt = selectTradeApiInstallSalt(getState());
    const installSalt = storedInstallSalt ?? generateTradeApiInstallSalt();

    if (!storedInstallSalt) {
        dispatch(tradingActions.setTradeApiInstallSalt(installSalt));
    }

    if (!account) {
        return createInstallTradeApiKey(installSalt);
    }

    return createSaltedTradeApiKey({
        descriptor: account.descriptor,
        salt: selectTradeApiDeviceSalt(getState(), account.deviceState) ?? installSalt,
    });
};

export type SetTradeApiKeyThunkState = TradingRootState;

export const setTradeApiKeyThunk = createThunk<
    void,
    TradeApiKeyThunkParams,
    { state: SetTradeApiKeyThunkState }
>(`${TRADING_THUNK_PREFIX}/setTradeApiKey`, ({ account }, { dispatch, getState }) => {
    tradeApi.setApiKey(resolveTradeApiKey(account, dispatch, getState));
});
