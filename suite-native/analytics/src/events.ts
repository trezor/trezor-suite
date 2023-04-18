import { FiatCurrencyCode } from '@suite-common/suite-config';
import { EthereumTokenSymbol } from '@suite-native/ethereum-tokens';
import { UNIT_ABBREVIATION } from '@suite-common/suite-constants';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { EventType } from './constants';

export type SuiteNativeAnalyticsEvent =
    | {
          type: EventType.AppReady;
          payload: {
              appLanguage: string;
              deviceLanguage?: string;
              localCurrency: FiatCurrencyCode;
              bitcoinUnit: UNIT_ABBREVIATION;
              screenWidth: number;
              screenHeight: number;
              osName: string;
              osVersion: string | number;
              discreetMode: boolean;
              theme: string;
              loadDuration: number;
          };
      }
    | {
          type: EventType.OnboardingCompleted;
          payload: {
              analyticsPermission: boolean;
          };
      }
    | {
          type: EventType.AssetsSync;
          payload: {
              assetSymbol: NetworkSymbol;
              tokenSymbols?: EthereumTokenSymbol[];
          };
      }
    | {
          type: EventType.ScreenChange;
          payload: {
              previousScreen: string;
              currentScreen: string;
          };
      }
    | {
          type: EventType.WatchPortfolioTimeframeChange;
          payload: {
              timeframe: string;
          };
      }
    | {
          type: EventType.AssetDetail;
          payload: {
              assetSymbol: NetworkSymbol;
              tokenSymbol?: EthereumTokenSymbol;
          };
      }
    | {
          type: EventType.AssetDetailTimeframeChange;
          payload: {
              timeframe: string;
              assetSymbol: NetworkSymbol;
              tokenSymbol?: EthereumTokenSymbol;
          };
      }
    | {
          type: EventType.TransactionDetail;
          payload: {
              assetSymbol: NetworkSymbol;
              tokenSymbol?: EthereumTokenSymbol;
          };
      }
    | {
          type: EventType.TransactionDetailParameters;
      }
    | {
          type: EventType.TransactionDetailCompareValues;
      }
    | {
          type: EventType.TransactionDetailInputOutput;
      }
    | {
          type: EventType.TransactionDetailExploreInBlockchain;
      }
    | {
          type: EventType.CreateReceiveAddress;
          payload: {
              assetSymbol: NetworkSymbol;
          };
      }
    | {
          type: EventType.CreateReceiveAddressShowAddress;
          payload: {
              assetSymbol: NetworkSymbol;
          };
      }
    | {
          type: EventType.SettingsChangeCurrency;
          payload: {
              currency: FiatCurrencyCode;
          };
      }
    | {
          type: EventType.SettingsChangeTheme;
          payload: {
              theme: string;
          };
      }
    | {
          type: EventType.SettingsChangeBtcUnit;
          payload: {
              unit: UNIT_ABBREVIATION;
          };
      }
    | {
          type: EventType.SettingsDiscreetToggle;
          payload: {
              value: boolean;
          };
      }
    | {
          type: EventType.SettingsDataPermission;
          payload: {
              value: boolean;
          };
      };
