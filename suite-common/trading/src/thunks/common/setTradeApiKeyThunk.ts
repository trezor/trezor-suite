import { type Account } from '@suite-common/wallet-types';
import { createThunk } from '@trezor/redux-utils';

import { TRADING_THUNK_PREFIX } from '../../constants';
import { type TradingRootState, tradingActions } from '../../reducers/tradingCommonReducer';
import {
    selectTradeApiDeviceSalt,
    selectTradeApiInstallSalt,
} from '../../selectors/tradingSelectors';
import { tradeApi } from '../../tradeApi';
import { generateTradeApiInstallSalt } from '../../utils/tradeApiSaltUtils';

type SetTradeApiKeyThunkParams = {
    account: Pick<Account, 'descriptor' | 'deviceState'>;
};

export type SetTradeApiKeyThunkState = TradingRootState;

export const setTradeApiKeyThunk = createThunk<
    void,
    SetTradeApiKeyThunkParams,
    { state: SetTradeApiKeyThunkState }
>(`${TRADING_THUNK_PREFIX}/setTradeApiKey`, ({ account }, { dispatch, getState }) => {
    const storedInstallSalt = selectTradeApiInstallSalt(getState());
    const installSalt = storedInstallSalt ?? generateTradeApiInstallSalt();

    if (!storedInstallSalt) {
        dispatch(tradingActions.setTradeApiInstallSalt(installSalt));
    }

    tradeApi.createApiKey({
        descriptor: account.descriptor,
        salt: selectTradeApiDeviceSalt(getState(), account.deviceState) ?? installSalt,
    });
});
