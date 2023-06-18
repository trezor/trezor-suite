import {
    SavingsTradeItem,
    SavingsKYCStatus,
    SavingsListResponse,
    SavingsProviderInfo,
    SavingsTradeResponse,
} from 'invity-api';
import invityAPI from 'src/services/suite/invityAPI';
import { COINMARKET_COMMON, COINMARKET_SAVINGS } from './constants';
import { verifyAddress as verifySavingsAddress } from 'src/actions/wallet/coinmarket/coinmarketCommonActions';
import type { Account } from 'src/types/wallet';
import regional from 'src/constants/wallet/coinmarket/regional';
import * as modalActions from 'src/actions/suite/modalActions';
import type { Dispatch } from 'src/types/suite';

export interface SavingsInfo {
    savingsList?: SavingsListResponse;
    providerInfos: { [name: string]: SavingsProviderInfo };
    supportedFiatCurrencies: Set<string>;
    supportedCryptoCurrencies: Set<string>;
    supportedCountries: Set<string>;
    country: string;
}
export type CoinmarketSavingsAction =
    | {
          type: typeof COINMARKET_SAVINGS.LOAD_SAVINGS_TRADE_RESPONSE;
      }
    | {
          type: typeof COINMARKET_SAVINGS.SET_SAVINGS_TRADE_RESPONSE_LOADING;
          isSavingsTradeLoading: boolean;
      }
    | {
          type: typeof COINMARKET_SAVINGS.SAVE_SAVINGS_INFO;
          savingsInfo: SavingsInfo;
      }
    | {
          type: typeof COINMARKET_SAVINGS.SAVE_SAVINGS_TRADE_RESPONSE;
          response: SavingsTradeResponse;
      }
    | {
          type: typeof COINMARKET_SAVINGS.START_WATCHING_KYC_STATUS;
          exchange: string;
      }
    | {
          type: typeof COINMARKET_SAVINGS.STOP_WATCHING_KYC_STATUS;
          kycFinalStatus: SavingsKYCStatus | undefined;
      }
    | {
          type: typeof COINMARKET_COMMON.SAVE_TRADE;
          date: string;
          key?: string;
          tradeType: 'savings';
          data: SavingsTradeItem;
          account: {
              symbol: Account['symbol'];
              descriptor: Account['descriptor'];
              accountIndex: Account['index'];
              accountType: Account['accountType'];
          };
      }
    | {
          type: typeof COINMARKET_SAVINGS.CLEAR_SAVINGS_TRADE;
      }
    | {
          type: typeof COINMARKET_SAVINGS.SET_SELECTED_PROVIDER;
          provider: SavingsProviderInfo | undefined;
      };

export const loadSavingsInfo = async (): Promise<SavingsInfo> => {
    const savingsList = await invityAPI.getSavingsList();
    const providerInfos: { [name: string]: SavingsProviderInfo } = {};
    if (savingsList?.providers) {
        savingsList.providers.forEach(e => (providerInfos[e.name] = e));
    }

    const supportedFiatCurrencies = new Set<string>();
    const supportedCryptoCurrencies = new Set<string>();
    const supportedCountries = new Set<string>();
    savingsList?.providers.forEach(p => {
        if (p.tradedFiatCurrencies) {
            p.tradedFiatCurrencies
                .map(c => c.toLowerCase())
                .forEach(c => supportedFiatCurrencies.add(c));
        }
        p.tradedCoins.map(c => c.toLowerCase()).forEach(c => supportedCryptoCurrencies.add(c));
        p.supportedCountries.forEach(c => supportedCountries.add(c));
    });

    const country = savingsList?.country || regional.unknownCountry;

    return {
        savingsList,
        providerInfos,
        supportedFiatCurrencies,
        supportedCryptoCurrencies,
        supportedCountries,
        country,
    };
};

export const loadSavingsTrade = (): CoinmarketSavingsAction => ({
    type: COINMARKET_SAVINGS.LOAD_SAVINGS_TRADE_RESPONSE,
});

export const setSavingsTradeResponseLoading = (
    isSavingsTradeLoading: boolean,
): CoinmarketSavingsAction => ({
    type: COINMARKET_SAVINGS.SET_SAVINGS_TRADE_RESPONSE_LOADING,
    isSavingsTradeLoading,
});

export const saveSavingsInfo = (savingsInfo: SavingsInfo): CoinmarketSavingsAction => ({
    type: COINMARKET_SAVINGS.SAVE_SAVINGS_INFO,
    savingsInfo,
});

export const saveSavingsTradeResponse = (
    response: SavingsTradeResponse,
): CoinmarketSavingsAction => ({
    type: COINMARKET_SAVINGS.SAVE_SAVINGS_TRADE_RESPONSE,
    response,
});

export const startWatchingKYCStatus = (exchange: string): CoinmarketSavingsAction => ({
    type: COINMARKET_SAVINGS.START_WATCHING_KYC_STATUS,
    exchange,
});

export const stopWatchingKYCStatus = (
    kycFinalStatus: SavingsKYCStatus | undefined,
): CoinmarketSavingsAction => ({
    type: COINMARKET_SAVINGS.STOP_WATCHING_KYC_STATUS,
    kycFinalStatus,
});

export const verifyAddress = (account: Account, address?: string, path?: string) =>
    verifySavingsAddress(account, address, path, COINMARKET_SAVINGS.VERIFY_ADDRESS);

export const saveTrade = (
    savingsTrade: SavingsTradeItem,
    account: Account,
    date: string,
): CoinmarketSavingsAction => ({
    type: COINMARKET_COMMON.SAVE_TRADE,
    tradeType: 'savings',
    key: savingsTrade.id,
    date,
    data: savingsTrade,
    account: {
        descriptor: account.descriptor,
        symbol: account.symbol,
        accountType: account.accountType,
        accountIndex: account.index,
    },
});

export const clearSavingsTrade = (): CoinmarketSavingsAction => ({
    type: COINMARKET_SAVINGS.CLEAR_SAVINGS_TRADE,
});

export const setSelectedProvider = (
    provider: SavingsProviderInfo | undefined,
): CoinmarketSavingsAction => ({
    type: COINMARKET_SAVINGS.SET_SELECTED_PROVIDER,
    provider,
});

// this is only a wrapper for `openDeferredModal` since it doesn't work with `bindActionCreators`
export const openCoinmarketSavingsConfirmModal = (provider?: string) => (dispatch: Dispatch) =>
    dispatch(modalActions.openDeferredModal({ type: 'coinmarket-savings-terms', provider }));
