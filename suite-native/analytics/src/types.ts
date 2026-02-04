import { TradingType } from '@suite-common/trading';
import type { AccountType, NetworkSymbol } from '@suite-common/wallet-config';
import { TokenAddress, TokenSymbol } from '@suite-common/wallet-types';

import { EventType } from './constants';

export type CountryChangeContextCheck = 'settings' | 'onboarding';
export type CountryChangeContext = Exclude<TradingType, 'exchange'> | CountryChangeContextCheck;
export type CountryChangeAction = 'submitDefault' | 'submitCustom' | 'cancel';

/** @deprecated use `AnalyticsNativeEvents` */
export type SuiteNativeLegacyAnalyticsEvents =
    | {
          type: EventType.EjectDeviceClick;
          payload: {
              origin: 'deviceManager' | 'deviceNotReadyModal';
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
              numberOfNonZeroAccounts: number;
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
          type: EventType.SettingsAutoEjectToggle;
          payload: { enabled: boolean };
      }
    | {
          type: EventType.AutoEjectModal;
          payload: { value: 'enable' | 'skip' };
      }
    | {
          type: EventType.PassphraseMismatch;
      }
    | {
          type: EventType.PassphraseDuplicate;
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
