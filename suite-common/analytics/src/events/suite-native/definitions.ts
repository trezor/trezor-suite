import { FirmwareType } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';

export type AnalyticsSendFlowStep =
    | 'address_and_amount'
    | 'fee_settings'
    | 'address_review'
    | 'outputs_review'
    | 'utxo_selection'
    | 'destination_tag_review';

export type DeviceAuthenticityCheckResult = 'successful' | 'compromised' | 'cancelled' | 'failed';

export type FirmwareUpdatePayload = {
    model: DeviceModelInternal;
    fromBootloaderVersion: string;
    fromFwVersion: string;
    toFwVersion: string;
    fromFwType: FirmwareType | 'none';
    toFwType: FirmwareType;
    location: 'settings' | 'onboarding' | null;
};

export type FirmwareUpdateStuckedState = 'modalPart1' | 'modalPart2' | 'buttonVisible';
export type FirmwareUpdateStartType = 'normal' | 'retry';

export type TradingNavigateFrom =
    | 'trade'
    | 'account'
    | 'dashboard'
    | 'trade/buy'
    | 'trade/sell'
    | 'trade/exchange';
export type TradingExchangeAction = 'continue' | 'cancel' | 'retry' | 'visit';
export type TradingExchangeStep =
    | 'exchange-form'
    | 'account-selection'
    | 'create-approval'
    | 'already-approved'
    | 'confirm-and-send'
    | 'transaction-preview'
    | 'fee-selection'
    | 'sign-and-send'
    | 'webview';

export type TradingSellAction = 'continue' | 'cancel' | 'retry' | 'visit';
export type TradingSellStep =
    | 'sell-form'
    | 'transaction-preview'
    | 'fee-selection'
    | 'sign-and-send'
    | 'webview';

export type DemoAccountQuestionnaireQuestion = 'reason' | 'suiteAction';

export type DemoAccountQuestionnaireQuestionOption =
    | 'considering'
    | 'ad'
    | 'friend'
    | 'none'
    | 'explore'
    | 'transaction'
    | 'hardwareWallet';

export type DemoAccountQuestionnaireLinkKey =
    | 'hardwareWallet'
    | 'trezorSecurity'
    | 'TS7'
    | 'dashboard';
