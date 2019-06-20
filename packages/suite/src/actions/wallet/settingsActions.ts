import * as SETTINGS from './constants/settings';

export type settingsActions =
    | {
          type: typeof SETTINGS.SET_HIDDEN_COINS;
          hiddenCoins: string[];
      }
    | {
          type: typeof SETTINGS.SET_HIDDEN_COINS_EXTERNAL;
          hiddenCoinsExternal: string[];
      }
    | {
          type: typeof SETTINGS.SET_LOCAL_CURRENCY;
          localCurrency: string;
      }
    | {
          type: typeof SETTINGS.SET_HIDE_BALANCE;
          toggled: boolean;
      };

export const setLocalCurrency = (localCurrency: string) => ({
    type: SETTINGS.SET_LOCAL_CURRENCY,
    localCurrency: localCurrency.toLowerCase(),
});

export const setHideBalance = (toggled: boolean) => ({
    type: SETTINGS.SET_HIDE_BALANCE,
    toggled,
});
