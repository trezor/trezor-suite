import { TradingType } from '@suite-common/trading';
import type { AccountType, NetworkSymbol } from '@suite-common/wallet-config';
import { FeeLevelLabel, TokenAddress, TokenSymbol } from '@suite-common/wallet-types';
import { DeviceMode, VersionArray } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';

import { EventType } from './constants';
import { AnalyticsSendFlowStep, DeviceAuthenticityCheckResult } from './definitions';

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
          type: EventType.ConnectDevice;
          payload: {
              mode: DeviceMode | null;
              firmwareVersion: VersionArray | null;
              pinProtection: boolean | null;
              deviceModel: DeviceModelInternal | null;
              isBitcoinOnly: boolean | null;
              deviceLanguage: string | null;
              connectionType: 'cable' | 'bluetooth';
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
      }
    | {
          type: EventType.SendTransactionDispatched;
          payload: {
              symbol: NetworkSymbol;
              outputsCount: number;
              selectedFee: FeeLevelLabel;
              wasAppLeftDuringReview: boolean;
              tokenSymbols?: TokenSymbol[];
              tokenAddresses?: TokenAddress[];
              hasEthereumData?: boolean;
              hasEthereumNonce?: boolean;
              hasDestinationTag?: boolean;
              hasBitcoinLocktime?: boolean;
          };
      }
    | {
          type: EventType.SendAddressFilled;
          payload: {
              method: 'manual' | 'qr';
          };
      }
    | {
          type: EventType.SendFeeLevelChanged;
          payload: {
              value: FeeLevelLabel;
          };
      }
    | {
          type: EventType.SendRecipientCountChanged;
          payload: {
              count: number;
          };
      }
    | {
          type: EventType.SendAmountInputSwitched;
          payload: {
              changedTo: 'crypto' | 'fiat';
          };
      }
    | {
          type: EventType.SendFlowExited;
          payload: {
              step: AnalyticsSendFlowStep;
          };
      }
    | {
          type: EventType.SendFlowEntered;
          payload: {
              location: 'dashboard' | 'accountDetail';
              assetSymbol: NetworkSymbol;
              tokenSymbol?: TokenSymbol;
              tokenContract?: TokenAddress;
          };
      }
    | {
          type: EventType.ReceiveFlowEntered;
          payload: {
              location: 'dashboard' | 'accountDetail';
              assetSymbol: NetworkSymbol;
              tokenSymbol?: TokenSymbol;
              tokenContract?: TokenAddress;
          };
      }
    | {
          type: EventType.DeviceSettingsPinProtectionChange;
          payload: {
              action: 'enable' | 'change' | 'disable';
          };
      }
    | {
          type: EventType.DeviceSettingsAuthenticityCheck;
          payload: {
              result: DeviceAuthenticityCheckResult;
          };
      };
