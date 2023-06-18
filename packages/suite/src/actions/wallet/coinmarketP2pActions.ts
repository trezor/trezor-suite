import { COINMARKET_P2P } from 'src/actions/wallet/constants';
import { Dispatch } from 'src/types/suite';
import * as modalActions from 'src/actions/suite/modalActions';
import invityAPI from 'src/services/suite/invityAPI';
import { P2pProviderInfo, P2pQuote, P2pQuotesRequest } from 'invity-api';

export interface P2pInfo {
    country?: string;
    suggestedFiatCurrency?: string; // optional field, fiat currency based on user's IP
    providers: { [name: string]: P2pProviderInfo };
    supportedCoins: Set<string>;
    supportedCurrencies: Set<string>;
    supportedCountries: Set<string>;
}

export type CoinmarketP2pAction =
    | { type: typeof COINMARKET_P2P.SAVE_P2P_INFO; p2pInfo: P2pInfo }
    | { type: typeof COINMARKET_P2P.SAVE_QUOTES_REQUEST; request: P2pQuotesRequest }
    | { type: typeof COINMARKET_P2P.SAVE_QUOTES; quotes: P2pQuote[] };

export const loadP2pInfo = async (): Promise<P2pInfo> => {
    const p2pInfo = await invityAPI.getP2pList();

    const country = p2pInfo?.country;
    const suggestedFiatCurrency = p2pInfo?.suggestedFiatCurrency;
    const providers: { [name: string]: P2pProviderInfo } = {};
    const supportedCoins: string[] = [];
    const supportedCurrencies: string[] = [];
    const supportedCountries: string[] = [];
    p2pInfo?.providers.forEach(provider => {
        providers[provider.name] = provider;
        if (provider.isActive) {
            supportedCoins.push(...provider.tradedCoins.map(c => c.toLowerCase()));
            supportedCurrencies.push(...provider.tradedCurrencies.map(c => c.toLowerCase()));
            supportedCountries.push(...provider.supportedCountries);
        }
    });

    return {
        country,
        suggestedFiatCurrency,
        providers,
        supportedCoins: new Set(supportedCoins),
        supportedCurrencies: new Set(supportedCurrencies),
        supportedCountries: new Set(supportedCountries),
    };
};

export const saveP2pInfo = (p2pInfo: P2pInfo): CoinmarketP2pAction => ({
    type: COINMARKET_P2P.SAVE_P2P_INFO,
    p2pInfo,
});

export const saveQuotesRequest = (request: P2pQuotesRequest): CoinmarketP2pAction => ({
    type: COINMARKET_P2P.SAVE_QUOTES_REQUEST,
    request,
});

export const saveQuotes = (quotes: P2pQuote[]): CoinmarketP2pAction => ({
    type: COINMARKET_P2P.SAVE_QUOTES,
    quotes,
});

// this is only a wrapper for `openDeferredModal` since it doesn't work with `bindActionCreators`
export const openCoinmarketP2pConfirmModal =
    (provider?: string, cryptoCurrency?: string) => (dispatch: Dispatch) =>
        dispatch(
            modalActions.openDeferredModal({
                type: 'coinmarket-p2p-terms',
                provider,
                cryptoCurrency,
            }),
        );
