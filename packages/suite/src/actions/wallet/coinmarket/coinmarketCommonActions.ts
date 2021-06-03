import TrezorConnect, { UI, ButtonRequestMessage } from 'trezor-connect';
import { GetState, Dispatch } from '@suite-types';
import * as notificationActions from '@suite-actions/notificationActions';
import * as modalActions from '@suite-actions/modalActions';
import { COINMARKET_BUY, COINMARKET_EXCHANGE, COINMARKET_COMMON } from '../constants';
import { getUnusedAddressFromAccount } from '@wallet-utils/coinmarket/coinmarketUtils';
import { Account } from '@wallet-types';
import { ComposedTransactionInfo } from '@wallet-reducers/coinmarketReducer';
import * as suiteActions from '@suite-actions/suiteActions';
import { submitRequestForm as envSubmitRequestForm, isDesktop } from '@suite-utils/env';

export type CoinmarketCommonAction =
    | {
          type: typeof COINMARKET_COMMON.SAVE_COMPOSED_TRANSACTION_INFO;
          info: ComposedTransactionInfo;
      }
    | {
          type: typeof COINMARKET_COMMON.SET_LOADING;
          isLoading: boolean;
          lastLoadedTimestamp: number;
      }
    | {
          type: typeof COINMARKET_COMMON.LOAD_DATA;
      };

export const verifyAddress = (account: Account, inExchange = false) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { device } = getState().suite;
    if (!device || !account) return;
    const { path, address } = getUnusedAddressFromAccount(account);
    if (!path || !address) return;

    const { networkType, symbol } = account;
    const { useEmptyPassphrase, connected, available } = device;

    const modalPayload = {
        device,
        address,
        networkType,
        symbol,
        addressPath: path,
    };

    // Show warning when device is not connected
    if (!connected || !available) {
        dispatch(
            modalActions.openModal({
                type: 'unverified-address',
                ...modalPayload,
            }),
        );
        return;
    }

    const params = {
        device,
        path,
        useEmptyPassphrase,
        coin: account.symbol,
    };

    // catch button request and open modal
    const buttonRequestHandler = (event: ButtonRequestMessage['payload']) => {
        if (!event || event.code !== 'ButtonRequest_Address') return;
        dispatch(
            modalActions.openModal({
                type: 'address',
                ...modalPayload,
            }),
        );
    };

    let fn;
    switch (networkType) {
        case 'ethereum':
            fn = TrezorConnect.ethereumGetAddress;
            break;
        case 'ripple':
            fn = TrezorConnect.rippleGetAddress;
            break;
        case 'bitcoin':
            fn = TrezorConnect.getAddress;
            break;
        default:
            fn = () => ({
                success: false,
                payload: { error: 'Method for getAddress not defined', code: undefined },
            });
            break;
    }

    TrezorConnect.on(UI.REQUEST_BUTTON, buttonRequestHandler);
    const response = await fn(params);
    TrezorConnect.off(UI.REQUEST_BUTTON, buttonRequestHandler);

    if (response.success) {
        dispatch({
            type: inExchange ? COINMARKET_EXCHANGE.VERIFY_ADDRESS : COINMARKET_BUY.VERIFY_ADDRESS,
            addressVerified: address,
        });
    } else {
        // special case: device no-backup permissions not granted
        if (response.payload.code === 'Method_PermissionsNotGranted') return;

        dispatch(
            notificationActions.addToast({
                type: 'verify-address-error',
                error: response.payload.error,
            }),
        );
    }
};

export const saveComposedTransactionInfo = (
    info: ComposedTransactionInfo,
): CoinmarketCommonAction => ({
    type: COINMARKET_COMMON.SAVE_COMPOSED_TRANSACTION_INFO,
    info,
});

export const submitRequestForm = (form?: {
    formMethod: 'GET' | 'POST' | 'IFRAME';
    formAction: string;
    fields: {
        [key: string]: string;
    };
}) => (dispatch: Dispatch, getState: GetState) => {
    const { device } = getState().suite;
    if (device && !device.remember && !isDesktop()) {
        dispatch(suiteActions.rememberDevice(device, true));
    }
    if (form) {
        envSubmitRequestForm(form.formMethod, form.formAction, form.fields);
    }
};

export const setLoading = (isLoading: boolean, lastLoadedTimestamp?: number) => ({
    type: COINMARKET_COMMON.SET_LOADING,
    isLoading,
    ...(lastLoadedTimestamp && { lastLoadedTimestamp }),
});

export const loadInvityData = () => ({
    type: COINMARKET_COMMON.LOAD_DATA,
});
