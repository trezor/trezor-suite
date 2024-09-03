import { FiatCurrencyCode } from '@suite-common/suite-config';
import { UNIT_ABBREVIATION } from '@suite-common/suite-constants';
import { AccountType, NetworkSymbol } from '@suite-common/wallet-config';
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
              pixelDensity: number;
              fontScale: number;
              osName: string;
              osVersion: string | number;
              discreetMode: boolean;
              theme: string;
              loadDuration: number;
              isBiometricsEnabled: boolean;
              rememberedStandardWallets: number;
              rememberedHiddenWallets: number;
              enabledNetworks: NetworkSymbol[];
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
          type: EventType.SettingsChangeCoinEnabled;
          payload: {
              symbol: NetworkSymbol;
              value: boolean;
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
              deviceState:
                  | 'unsupportedFirmware'
                  | 'noSeed'
                  | 'bootloaderMode'
                  | 'noSeedWithFirmware';
          };
      }
    | {
          type: EventType.DiscoveryDuration;
          payload: {
              discoveryId: string; // Used for grouping multiple events of a single discovery run together.
              loadDuration: number;
              networkSymbols: NetworkSymbol[];
          };
      }
    | {
          type: EventType.CoinDiscovery;
          payload: {
              discoveryId: string;
              symbol: NetworkSymbol;
              numberOfAccounts: number;
              tokenSymbols?: TokenSymbol[];
              tokenAddresses?: TokenAddress[];
          };
      }
    | {
          type: EventType.CoinDiscoveryNewAccount;
          payload: {
              symbol: NetworkSymbol;
              path: string;
              type: AccountType;
          };
      }
    | {
          type: EventType.ViewOnlyChange;
          payload: { enabled: boolean; origin: 'bottomSheet' | 'settingsToggle' };
      }
    | {
          type: EventType.ViewOnlySkipped;
          payload: { action: 'button' | 'close' };
      }
    | {
          type: EventType.PassphraseMismatch;
      }
    | {
          type: EventType.PassphraseDuplicate;
      }
    | {
          type: EventType.PassphraseNotEnabled;
      }
    | {
          type: EventType.PassphraseArticleOpened;
      }
    | {
          type: EventType.PassphraseEnterOnTrezor;
      }
    | {
          type: EventType.PassphraseEnterInApp;
      }
    | {
          type: EventType.PassphraseFlowFinished;
          payload: { isEmptyWallet: boolean };
      }
    | {
          type: EventType.PassphraseTryAgain;
      }
    | {
          type: EventType.PassphraseExit;
          payload: { screen: string };
      }
    | {
          type: EventType.PassphraseAddHiddenWallet;
      }
    | {
          type: EventType.CoinEnablingInitState;
          payload: {
              enabledNetworks: NetworkSymbol[];
          };
      };
