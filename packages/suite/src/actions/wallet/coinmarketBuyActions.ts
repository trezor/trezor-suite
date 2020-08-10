import TrezorConnect, { UI, ButtonRequestMessage } from 'trezor-connect';
import * as modalActions from '@suite-actions/modalActions';
import * as notificationActions from '@suite-actions/notificationActions';
import { BuyListResponse, BuyProviderInfo, BuyTradeQuoteRequest, BuyTrade } from 'invity-api';
import invityAPI from '@suite/services/invityAPI';
import { COINMARKET_BUY } from './constants';
import { Dispatch, GetState } from '@suite-types';
import regional from '@suite/constants/wallet/coinmarket/regional';

export interface BuyInfo {
    buyInfo?: BuyListResponse;
    providerInfos: { [name: string]: BuyProviderInfo };
    supportedFiatCurrencies: Set<string>;
    supportedCryptoCurrencies: Set<string>;
}

export type CoinmarketBuyActions =
    | { type: typeof COINMARKET_BUY.SAVE_BUY_INFO; buyInfo: BuyInfo }
    | { type: typeof COINMARKET_BUY.SAVE_QUOTE_REQUEST; request: BuyTradeQuoteRequest }
    | { type: typeof COINMARKET_BUY.VERIFY_ADDRESS; addressVerified: boolean }
    | {
          type: typeof COINMARKET_BUY.SAVE_QUOTES;
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

    const tradedFiatCurrencies: string[] = [];
    const tradedCoins: string[] = [];
    buyInfo.providers.forEach(p => {
        tradedFiatCurrencies.push(...p.tradedFiatCurrencies.map(c => c.toLowerCase()));
        tradedCoins.push(...p.tradedCoins.map(c => c.toLowerCase()));
    });
    const supportedFiatCurrencies = new Set(tradedFiatCurrencies);
    const supportedCryptoCurrencies = new Set(tradedCoins);

    return {
        buyInfo,
        providerInfos,
        supportedFiatCurrencies,
        supportedCryptoCurrencies,
    };
}

export const saveBuyInfo = (buyInfo: BuyInfo) => async (dispatch: Dispatch) => {
    dispatch({
        type: COINMARKET_BUY.SAVE_BUY_INFO,
        buyInfo,
    });
};

export const saveQuoteRequest = (request: BuyTradeQuoteRequest) => async (dispatch: Dispatch) => {
    dispatch({
        type: COINMARKET_BUY.SAVE_QUOTE_REQUEST,
        request,
    });
};

export const saveQuotes = (quotes: BuyTrade[], alternativeQuotes: BuyTrade[] | undefined) => async (
    dispatch: Dispatch,
) => {
    dispatch({
        type: COINMARKET_BUY.SAVE_QUOTES,
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
