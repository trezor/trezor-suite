import TrezorConnect, { UI, ButtonRequestMessage } from 'trezor-connect';
import { GetState, Dispatch } from '@suite-types';
import * as notificationActions from '@suite-actions/notificationActions';
import * as modalActions from '@suite-actions/modalActions';
import { COINMARKET_BUY, COINMARKET_EXCHANGE, COINMARKET_COMMON } from '../constants';
import { getUnusedAddressFromAccount } from '@wallet-utils/coinmarket/coinmarketUtils';
import { Account } from '@wallet-types';
import { ComposedTransactionInfo } from '@wallet-reducers/coinmarketReducer';
import * as suiteActions from '@suite-actions/suiteActions';
import {
    getStakingPath,
    getProtocolMagic,
    getNetworkId,
    getAddressType,
    getDerivationType,
} from '@wallet-utils/cardanoUtils';

import { submitRequestForm as envSubmitRequestForm, isDesktop } from '@suite-utils/env';
import { WhoAmI } from '@suite/components/wallet/CoinmarketAuthentication';

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
      }
    | {
          type: typeof COINMARKET_COMMON.SAVE_INVITY_AUTHENTICATION;
          invityAuthentication: WhoAmI;
      };

export const verifyAddress =
    (
        account: Account,
        address: string | undefined,
        path: string | undefined,
        coinmarketAction:
            | typeof COINMARKET_EXCHANGE.VERIFY_ADDRESS
            | typeof COINMARKET_BUY.VERIFY_ADDRESS,
    ) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const { device } = getState().suite;
        if (!device || !account) return;
        const accountAddress = getUnusedAddressFromAccount(account);
        address = address ?? accountAddress.address;
        path = path ?? accountAddress.path;
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

        TrezorConnect.on(UI.REQUEST_BUTTON, buttonRequestHandler);

        let response;
        switch (account.networkType) {
            case 'ethereum':
                response = await TrezorConnect.ethereumGetAddress(params);
                break;
            case 'cardano':
                response = await TrezorConnect.cardanoGetAddress({
                    device,
                    useEmptyPassphrase: device.useEmptyPassphrase,
                    addressParameters: {
                        stakingPath: getStakingPath(account),
                        addressType: getAddressType(account.accountType),
                        path,
                    },
                    protocolMagic: getProtocolMagic(account.symbol),
                    networkId: getNetworkId(account.symbol),
                    derivationType: getDerivationType(account.accountType),
                });
                break;
            case 'ripple':
                response = await TrezorConnect.rippleGetAddress(params);
                break;
            case 'bitcoin':
                response = await TrezorConnect.getAddress(params);
                break;
            default:
                response = {
                    success: false,
                    payload: { error: 'Method for getAddress not defined', code: undefined },
                };
                break;
        }

        TrezorConnect.off(UI.REQUEST_BUTTON, buttonRequestHandler);

        if (response.success) {
            dispatch({
                type: coinmarketAction,
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

export const submitRequestForm =
    (form?: {
        formMethod: 'GET' | 'POST' | 'IFRAME';
        formAction: string;
        fields: {
            [key: string]: string;
        };
    }) =>
    (dispatch: Dispatch, getState: GetState) => {
        const { device } = getState().suite;
        if (device && !device.remember && !isDesktop()) {
            dispatch(suiteActions.toggleRememberDevice(device, true));
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

export const loadInvityData = (): CoinmarketCommonAction => ({
    type: COINMARKET_COMMON.LOAD_DATA,
});

export const saveInvityAuthentication = (invityAuthentication: WhoAmI) => ({
    type: COINMARKET_COMMON.SAVE_INVITY_AUTHENTICATION,
    invityAuthentication,
});
