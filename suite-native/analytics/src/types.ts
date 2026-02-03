import { TradingType } from '@suite-common/trading';
import type { AccountType, NetworkSymbol } from '@suite-common/wallet-config';
import { FeeLevelLabel, TokenAddress, TokenSymbol } from '@suite-common/wallet-types';
import { DeviceMode, VersionArray } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';

import { EventType } from './constants';
import {
    AnalyticsSendFlowStep,
    DeviceAuthenticityCheckResult,
    FirmwareUpdatePayload,
    FirmwareUpdateStartType,
    FirmwareUpdateStuckedState,
    TradingExchangeAction,
    TradingExchangeStep,
    TradingNavigateFrom,
    TradingSellAction,
    TradingSellStep,
} from './definitions';

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
      }
    | {
          type: EventType.DeviceSettingsCheckBackupEntered;
      }
    | {
          type: EventType.DeviceSettingsCheckBackupFinished;
          payload: {
              success: boolean;
          };
      }
    | {
          type: EventType.DeviceSettingsCheckBackupExited;
          payload: {
              location: string;
          };
      }
    | {
          type: EventType.DeviceSettingsCheckBackupSupport;
      }
    | {
          type: EventType.FirmwareUpdateStarted;
          payload: FirmwareUpdatePayload & {
              startType: FirmwareUpdateStartType;
          };
      }
    | {
          type: EventType.FirmwareUpdateCancel;
          payload: FirmwareUpdatePayload;
      }
    | {
          type: EventType.FirmwareUpdateFinished;
          payload: FirmwareUpdatePayload & {
              duration: number;
              error?: string;
          };
      }
    | {
          type: EventType.FirmwareUpdateStucked;
          payload: FirmwareUpdatePayload & {
              duration: number;
              stuckedType: FirmwareUpdateStuckedState;
          };
      }
    | {
          type: EventType.TradingQuoteReceived;
          payload: {
              type: TradingType;
          };
      }
    | {
          type: EventType.TradingCompareOffers;
          payload: {
              type: TradingType;
          };
      }
    | {
          type: EventType.TradingNavigate;
          payload: {
              action: 'navigate' | 'cancel';
              type: TradingType;
              from: TradingNavigateFrom;

              networkSymbol?: string;
              contractAddress?: string;
          };
      }
    | {
          type: EventType.TradingBuy;
          payload: {
              action: 'continue' | 'cancel';
              step: 'buy-form' | 'account-selection';

              cryptoLabel?: string;
              cryptoNetworkSymbol?: string;
              cryptoContractAddress?: string;

              paymentMethod?: string;
              countryOfResidence?: string;

              exchangeName?: string;
          };
      }
    | {
          type: EventType.TradingExchange;
          payload: {
              action: TradingExchangeAction;
              step: TradingExchangeStep;

              sendCryptoLabel?: string;
              sendCryptoNetworkSymbol?: string;
              sendCryptoContractAddress?: string;

              receiveCryptoLabel?: string;
              receiveCryptoNetworkSymbol?: string;
              receiveCryptoContractAddress?: string;

              exchangeName?: string;
              exchangeType?: string;

              accountType?: string;
              approvalType?: string;
              slippage?: string;
              rateType?: string;
          };
      }
    | {
          type: EventType.TradingSell;
          payload: {
              action: TradingSellAction;
              step: TradingSellStep;

              cryptoLabel?: string;
              cryptoNetworkSymbol?: string;
              cryptoContractAddress?: string;

              receiveMethod?: string;
              countryOfResidence?: string;

              exchangeName?: string;
          };
      }
    | {
          type: EventType.TradingStatus;
          payload: {
              type: TradingType;
              status:
                  | 'waiting'
                  | 'processing'
                  | 'pending'
                  | 'converting'
                  | 'sending'
                  | 'kyc'
                  | 'success'
                  | 'error';
          };
      }
    | {
          type: EventType.TradingSuccess;
          payload: {
              type: TradingType;
          };
      }
    | {
          type: EventType.TradingConfirmTrade;
          payload: {
              type: TradingType;
          };
      }
    | {
          type: EventType.TradingParameterChanged;
          payload: {
              type: TradingType;
              parameter: 'fiat' | 'cryptoFrom' | 'cryptoTo' | 'paymentMethod' | 'provider';
          };
      }
    | {
          type: EventType.TradingParameterChanged;
          payload: {
              type: CountryChangeContext;
              parameter: 'country';
          };
      };
