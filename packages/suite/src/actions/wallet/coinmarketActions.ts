import TrezorConnect, { UI, ButtonRequestMessage } from 'trezor-connect';
import * as modalActions from '@suite-actions/modalActions';
import * as notificationActions from '@suite-actions/notificationActions';
import {
    BuyListResponse,
    BuyProviderInfo,
    BuyTradeQuoteRequest,
    BuyTrade,
} from '@suite/services/invityAPI/buyTypes';
import invityAPI from '@suite/services/invityAPI/service';
import { COINMARKET } from './constants';
import { Dispatch, GetState } from '@suite-types';
import regional from '@suite/constants/wallet/coinmarket/regional';

export interface BuyInfo {
    buyInfo?: BuyListResponse;
    providerInfos: { [name: string]: BuyProviderInfo };
}

export type CoinmarketActions =
    | { type: typeof COINMARKET.SAVE_BUY_INFO; buyInfo: BuyInfo }
    | { type: typeof COINMARKET.SAVE_BUY_QUOTE_REQUEST; request: BuyTradeQuoteRequest }
    | {
          type: typeof COINMARKET.SAVE_BUY_QUOTES;
          quotes: BuyTrade[];
          alternativeQuotes: BuyTrade[] | undefined;
      };

export async function loadBuyInfo(): Promise<BuyInfo> {
    let buyInfo = await invityAPI.getBuyList();

    if (!buyInfo) {
        buyInfo = { country: regional.unknownCountry, providers: [] };
    }

    if (!buyInfo.providers) {
        buyInfo.providers = [];
    }

    const providerInfos: { [name: string]: BuyProviderInfo } = {};

    buyInfo.providers.forEach(e => (providerInfos[e.name] = e));

    // TODO - add to BuyInfo fields supported fiat and crypto currencies and available countries (use getAvailableOptions from invity.io)

    return {
        buyInfo,
        providerInfos,
    };
}

export const saveBuyInfo = (buyInfo: BuyInfo) => async (dispatch: Dispatch) => {
    dispatch({
        type: COINMARKET.SAVE_BUY_INFO,
        buyInfo,
    });
};

export const saveBuyQuoteRequest = (request: BuyTradeQuoteRequest) => async (
    dispatch: Dispatch,
) => {
    dispatch({
        type: COINMARKET.SAVE_BUY_QUOTE_REQUEST,
        request,
    });
};

export const saveBuyQuotes = (
    quotes: BuyTrade[],
    alternativeQuotes: BuyTrade[] | undefined,
) => async (dispatch: Dispatch) => {
    dispatch({
        type: COINMARKET.SAVE_BUY_QUOTES,
        quotes,
        alternativeQuotes,
    });
};

export const verifyAddress = (path: string, address: string) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { device } = getState().suite;
    const { account } = getState().wallet.selectedAccount;
    if (!device || !account) return;

    const modalPayload = {
        device,
        address,
        addressPath: path,
        networkType: account.networkType,
        symbol: account.symbol,
    };

    // Show warning when device is not connected
    if (!device.connected || !device.available) {
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
        useEmptyPassphrase: device.useEmptyPassphrase,
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
    switch (account.networkType) {
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
        console.log('success');
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
