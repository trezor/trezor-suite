import invityAPI, {
    SavingsTradeItem,
    SavingsKYCStatus,
    SavingsListResponse,
    SavingsProviderInfo,
    SavingsTradeResponse,
} from '@suite-services/invityAPI';
import { COINMARKET_COMMON, COINMARKET_SAVINGS } from './constants';
import { verifyAddress as verifySavingsAddress } from '@wallet-actions/coinmarket/coinmarketCommonActions';
import type { Account } from '@wallet-types';
import regional from '@wallet-constants/coinmarket/regional';

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
          exchangeName: string;
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
        p.supportedCountries.map(c => c.toLowerCase()).forEach(c => supportedCountries.add(c));
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

export const loadSavingsTrade = (exchangeName: string): CoinmarketSavingsAction => ({
    type: COINMARKET_SAVINGS.LOAD_SAVINGS_TRADE_RESPONSE,
    exchangeName,
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
