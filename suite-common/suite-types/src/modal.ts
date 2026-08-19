import { type ActionCreatorWithPayload, type ActionCreatorWithoutPayload } from '@reduxjs/toolkit';

import { type RequestEnableTorResponse } from '@suite-common/suite-config';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type AddressType, type EvmSelectedFee } from '@suite-common/wallet-types';
import { type UI_EVENTS } from '@trezor/connect';
import { type Deferred } from '@trezor/utils';

import { type TrezorDevice } from './device';
import {
    type EarnAnalyticsStep,
    type EarnFlow,
    type EarnModalAction,
    type EarnProvider,
    type EarnYieldContext,
    type StakeModalFlow,
} from './staking';

export type UserContextPayload =
    | {
          type: 'qr-reader';
          decision: Deferred<string>;
      }
    | {
          type: 'unverified-xpub';
      }
    | {
          type: 'unverified-address-proceed';
          value: string;
      }
    | {
          type: 'xpub';
          isConfirmed?: boolean;
      }
    | {
          type: 'add-account';
          device: TrezorDevice;
          symbol?: Account['symbol'];
          isCoinjoinDisabled?: boolean;
          isBackClickDisabled?: boolean;
          onCancel?: () => void;
          onConfirm?: () => void;
      }
    | {
          type: 'device-background-gallery';
      }
    | {
          type: 'transaction-detail';
          txid: string;
          descriptor: Account['descriptor'];
          symbol: Account['symbol'];
          deviceState: Account['deviceState'];
          flow: 'detail' | 'bump-fee' | 'cancel-transaction';
          // Cancel is only offered from the account tx list; other entry points (trade detail,
          // trading approval, earn, notifications, coin control) can't reflect a cancel, so they
          // leave this unset and the Cancel button stays hidden.
          showCancelButton?: boolean;
      }
    | {
          type: 'review-transaction';
          decision: Deferred<boolean>;
      }
    | {
          type: 'review-transaction-rbf-previous-transaction-mined-error';
          decision?: Deferred<boolean>;
      }
    | {
          type: 'import-transaction';
          decision: Deferred<{ [key: string]: string }[]>;
      }
    | {
          type: 'application-log';
      }
    | {
          type: 'pin-mismatch';
      }
    | {
          type: typeof UI_EVENTS.PIN_INVALID_ATTEMPTS_DEPLETED;
      }
    | {
          type: 'device-authenticity-check-opt-out';
      }
    | {
          type: 'firmware-authenticity-checks-opt-out';
      }
    | {
          type: 'metadata-provider';
          decision: Deferred<boolean>;
      }
    | {
          type: 'advanced-coin-settings';
          symbol: NetworkSymbol;
      }
    | {
          type: 'activate-assets';
      }
    | {
          type: 'add-token';
      }
    | {
          type: 'safety-checks';
      }
    | {
          type: 'disable-tor';
          decision: Deferred<boolean>;
      }
    | {
          type: 'request-enable-tor';
          decision: Deferred<RequestEnableTorResponse>;
      }
    | {
          type: 'disable-tor-stop-coinjoin';
          decision: Deferred<boolean>;
      }
    | {
          type: 'tor-loading';
          decision: Deferred<boolean>;
      }
    | {
          type: 'cancel-coinjoin';
      }
    | {
          type: 'critical-coinjoin-phase';
          relatedAccountKey: string;
      }
    | {
          type: 'coinjoin-success';
          relatedAccountKey: string;
      }
    | {
          type: 'more-rounds-needed';
      }
    | {
          type: 'uneco-coinjoin-warning';
      }
    | {
          type: 'earn-in-a-nutshell';
          flow: EarnFlow.Stake | EarnFlow.UpdateProvider;
          provider: EarnProvider;
          account: Account;
          analyticsStep: Extract<EarnAnalyticsStep, 'staking-dashboard'>;
          actionType?: EarnModalAction;
          yieldContext?: EarnYieldContext;
      }
    | {
          type: 'earn-in-a-nutshell';
          flow: EarnFlow.Yield;
          provider: EarnProvider;
          account: Account;
          analyticsStep: Extract<
              EarnAnalyticsStep,
              'earn-dashboard' | 'yield-deposit' | 'yield-withdraw'
          >;
          actionType?: EarnModalAction;
          yieldContext?: EarnYieldContext;
      }
    | {
          type: 'tron-stake-in-a-nutshell';
          actionType?: EarnModalAction;
      }
    | {
          type: 'tron-vote-consent';
          representativeName: string;
          termsOfServiceUrl: string;
          decision: Deferred<boolean>;
      }
    | {
          type: 'stake';
          flow: StakeModalFlow;
          account: Account;
      }
    | {
          type: 'unstake';
          account: Account;
      }
    | {
          type: 'claim';
          account: Account;
      }
    | {
          type: 'earn-provider-consent';
          flow: EarnFlow;
          provider: EarnProvider;
          account: Account;
          yieldContext?: EarnYieldContext;
      }
    | {
          type: 'change-delegate';
      }
    | {
          type: 'copy-address';
          addressType: AddressType;
          address: string;
      }
    | {
          type: 'unhide-token';
          address: string;
      }
    | {
          type: 'connect-popup';
      }
    | {
          type: 'walletconnect-proposal';
          eventId: number;
      }
    | {
          type: 'walletconnect-switch-account';
          sessionTopic: string;
      }
    | {
          type: 'connect-address-confirmation';
      }
    | {
          type: 'connect-select-account';
      }
    | {
          type: 'connect-error';
      }
    | {
          type: 'connect-loading';
      }
    | {
          type: 'auto-start-before-quit';
      }
    | {
          type: 'connect-popup-tx-simulation';
      }
    | {
          type: 'earn-yield-tx-simulation';
          data: unknown;
          decision: Deferred<
              | {
                    value: true;
                    selectedFee: EvmSelectedFee | null;
                    /**
                     * Send a signal from the thunk to the modal that the related business logic has finished.
                     * Used for tracking the loading state of the confirm button in the modal.
                     */
                    resolve: () => void;
                }
              | {
                    value: false;
                }
          >;
      }
    | {
          type: 'wipe-device-success';
      };

export type OpenModalDep = {
    openModal: ActionCreatorWithPayload<UserContextPayload>;
};

export type OnModalCancelDep = {
    onModalCancel: ActionCreatorWithoutPayload;
};
