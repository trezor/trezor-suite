import invityAPI, {
    SavingsKYCStatus,
    SavingsListResponse,
    SavingsProviderInfo,
    SavingsTradeResponse,
} from '@suite-services/invityAPI';
import { COINMARKET_SAVINGS } from './constants';
import { verifyAddress as verifySavingsAddress } from '@wallet-actions/coinmarket/coinmarketCommonActions';
import type { Account } from '@wallet-types';

export interface SavingsInfo {
    savingsList?: SavingsListResponse;
    providerInfos: { [name: string]: SavingsProviderInfo };
    supportedFiatCurrencies: Set<string>;
    supportedCryptoCurrencies: Set<string>;
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
          type: typeof COINMARKET_SAVINGS.SET_WATCHING_KYC_STATUS_METADATA;
          timeoutId: number;
          intervalId: number;
      }
    | {
          type: typeof COINMARKET_SAVINGS.STOP_WATCHING_KYC_STATUS;
          kycFinalStatus: SavingsKYCStatus | undefined;
      };

export const loadSavingsInfo = async (): Promise<SavingsInfo> => {
    const savingsList = await invityAPI.getSavingsList();
    const providerInfos: { [name: string]: SavingsProviderInfo } = {};
    if (savingsList?.providers) {
        savingsList.providers.forEach(e => (providerInfos[e.name] = e));
    }

    const supportedFiatCurrencies = new Set<string>();
    const supportedCryptoCurrencies = new Set<string>();
    savingsList?.providers.forEach(p => {
        if (p.tradedFiatCurrencies) {
            p.tradedFiatCurrencies
                .map(c => c.toLowerCase())
                .forEach(c => supportedFiatCurrencies.add(c));
        }
        p.tradedCoins.map(c => c.toLowerCase()).forEach(c => supportedCryptoCurrencies.add(c));
    });

    return {
        savingsList,
        providerInfos,
        supportedFiatCurrencies,
        supportedCryptoCurrencies,
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

export const setWatchingKYCStatusMetadata = (
    intervalId: number,
    timeoutId: number,
): CoinmarketSavingsAction => ({
    type: COINMARKET_SAVINGS.SET_WATCHING_KYC_STATUS_METADATA,
    intervalId,
    timeoutId,
});

export const stopWatchingKYCStatus = (
    kycFinalStatus: SavingsKYCStatus | undefined,
): CoinmarketSavingsAction => ({
    type: COINMARKET_SAVINGS.STOP_WATCHING_KYC_STATUS,
    kycFinalStatus,
});

export const verifyAddress = (account: Account, address?: string, path?: string) =>
    verifySavingsAddress(account, address, path, COINMARKET_SAVINGS.VERIFY_ADDRESS);
