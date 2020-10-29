import TrezorConnect, { UI, ButtonRequestMessage } from 'trezor-connect';
import * as modalActions from '@suite-actions/modalActions';
import * as notificationActions from '@suite-actions/notificationActions';
import * as suiteActions from '@suite-actions/suiteActions';
import { COINMARKET_BUY } from './constants';
import { Dispatch, GetState } from '@suite-types';
import { BuyTradeFormResponse } from 'invity-api';
import { submitRequestForm as utilsSubmitRequestForm } from '@wallet-utils/coinmarket/buyUtils';
import { isDesktop } from '@suite/utils/suite/env';

export const verifyAddress = (path: string, address: string) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { device } = getState().suite;
    const { account } = getState().wallet.selectedAccount;
    if (!device || !account) return;

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
            type: COINMARKET_BUY.VERIFY_ADDRESS,
            addressVerified: true,
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

export const submitRequestForm = (tradeForm: BuyTradeFormResponse) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { device } = getState().suite;
    if (device && !device.remember && !isDesktop()) {
        dispatch(suiteActions.rememberDevice(device, true));
    }
    utilsSubmitRequestForm(tradeForm);
};
