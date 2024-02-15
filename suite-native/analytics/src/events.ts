import { FiatCurrencyCode } from '@suite-common/suite-config';
import { UNIT_ABBREVIATION } from '@suite-common/suite-constants';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { TokenAddress, TokenSymbol } from '@suite-common/wallet-types';
import { DeviceModelInternal, VersionArray } from '@trezor/connect';

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
              isBiometricsEnabled: boolean;
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
              tokenSymbols?: TokenSymbol[];
              tokenAddresses?: TokenAddress[];
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
              tokenSymbol?: TokenSymbol;
              tokenAddress?: TokenAddress;
          };
      }
    | {
          type: EventType.AssetDetailTimeframeChange;
          payload: {
              timeframe: string;
              assetSymbol: NetworkSymbol;
              tokenSymbol?: TokenSymbol;
              tokenAddress?: TokenAddress;
          };
      }
    | {
          type: EventType.TransactionDetail;
          payload: {
              assetSymbol: NetworkSymbol;
              tokenSymbol?: TokenSymbol;
              tokenAddress?: TokenAddress;
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
              localCurrency: FiatCurrencyCode;
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
              bitcoinUnit: UNIT_ABBREVIATION;
          };
      }
    | {
          type: EventType.SettingsDiscreetToggle;
          payload: {
              discreetMode: boolean;
          };
      }
    | {
          type: EventType.SettingsDataPermission;
          payload: {
              analyticsPermission: boolean;
          };
      }
    | {
          type: EventType.BiometricsChange;
          payload: { enabled: boolean; origin: 'bottomSheet' | 'settingsToggle' };
      }
    | { type: EventType.ConfirmedReceiveAdress }
    | { type: EventType.EmptyDashboardClick; payload: { action: 'syncCoins' | 'connectDevice' } }
    | {
          type: EventType.DeviceManagerClick;
          payload: {
              action:
                  | 'deviceItem'
                  | 'portfolioTracker'
                  | 'connectDeviceButton'
                  | 'syncCoinsButton'
                  | 'educationLink'
                  | 'eshopLink'
                  | 'deviceInfo';
          };
      }
    | {
          type: EventType.EjectDeviceClick;
          payload: {
              origin: 'deviceManager' | 'deviceNotReadyModal';
          };
      }
    | {
          type: EventType.ConnectDevice;
          payload: {
              firmwareVersion: VersionArray | null;
              pinProtection: boolean;
              deviceModel: DeviceModelInternal | null;
              isBitcoinOnly: boolean;
              deviceLanguage: string | null;
          };
      }
    | {
          type: EventType.UnsupportedDevice;
          payload: {
              deviceState: 'unsupportedFirmware' | 'noSeed' | 'bootloaderMode';
          };
      }
    | {
          type: EventType.CoinDiscovery;
          payload: {
              loadDuration: number;
          } & {
              [key in NetworkSymbol]: number;
          };
      };
