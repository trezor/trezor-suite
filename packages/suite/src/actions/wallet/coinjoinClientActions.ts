import * as COINJOIN from './constants/coinjoinConstants';
import { addToast } from '../suite/notificationActions';
import { CoinjoinClientService, CoinjoinStatus } from '@suite/services/coinjoin/coinjoinClient';
import { Dispatch } from '@suite-types';
import { Account } from '@suite-common/wallet-types';

const clientEnable = (symbol: Account['symbol']) =>
    ({ type: COINJOIN.CLIENT_ENABLE, symbol } as const);

const clientEnableSuccess = (symbol: Account['symbol'], status: CoinjoinStatus) =>
    ({
        type: COINJOIN.CLIENT_ENABLE_SUCCESS,
        symbol,
        status,
    } as const);

const clientEnableFailed = (symbol: Account['symbol']) =>
    ({
        type: COINJOIN.CLIENT_ENABLE_FAILED,
        symbol,
    } as const);

export type CoinjoinClientAction =
    | ReturnType<typeof clientEnable>
    | ReturnType<typeof clientEnableSuccess>
    | ReturnType<typeof clientEnableFailed>;

export const initCoinjoinClient = (symbol: Account['symbol']) => async (dispatch: Dispatch) => {
    // find already running instance of @trezor/coinjoin client
    const knownClient = CoinjoinClientService.getInstance(symbol);
    if (knownClient) {
        return knownClient;
    }

    // or start new instance
    dispatch(clientEnable(symbol));

    const client = CoinjoinClientService.createInstance(symbol);
    try {
        const status = await client.enable();
        dispatch(clientEnableSuccess(symbol, status));
        return client;
    } catch (error) {
        dispatch(clientEnableFailed(symbol));
        dispatch(
            addToast({
                type: 'error',
                error: `Coinjoin client not enabled: ${error.message}`,
            }),
        );
    }
};

// return only active instances
export const getCoinjoinClient = (symbol: Account['symbol']) => () =>
    CoinjoinClientService.getInstance(symbol);
