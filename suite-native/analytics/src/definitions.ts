import { type EarnAnalyticsStep } from '@suite-common/suite-types';
import { type TradingType } from '@suite-common/trading';
import { type FirmwareType } from '@trezor/connect';
import { type DeviceModelInternal } from '@trezor/device-utils';

export type AnalyticsSendFlowStep =
    | 'address_and_amount'
    | 'address_review'
    | 'outputs_review'
    | 'utxo_selection'
    | 'destination_tag_review';

export type CountryChangeContextCheck = 'settings' | 'onboarding';
export type CountryChangeContext = Exclude<TradingType, 'exchange'> | CountryChangeContextCheck;
export type CountryChangeAction = 'submitDefault' | 'submitCustom' | 'cancel';

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
export type FirmwareUpdateLocation = 'settings' | 'onboarding' | null;

export type StakingClaimStep = Extract<EarnAnalyticsStep, 'staking-dashboard' | 'claim-form-modal'>;
export type StakingConfirmAction = 'stake' | 'unstake' | 'claim';
export type StakingNavigateFrom =
    | 'earn/staking-inactive'
    | 'earn/staking-active'
    | 'earn/staking-max'
    | 'earn/insufficient-funds'
    | 'earn/staked-but-insufficient-funds';
export type StakingStakeStep = Extract<
    EarnAnalyticsStep,
    | 'staking-dashboard'
    | 'stake-in-a-nutshell-modal'
    | 'funds-maintained-modal'
    | 'stake-form-modal'
    | 'entry-period-stake-modal'
>;
export type StakingUnstakeStep = Extract<
    EarnAnalyticsStep,
    'staking-dashboard' | 'unstake-form-modal'
>;

export type TradingNavigateFrom =
    | 'trade'
    | 'account'
    | 'dashboard'
    | 'trade/buy'
    | 'trade/sell'
    | 'trade/exchange'
    | 'trade/concierge';
export type TradingExchangeAction = 'continue' | 'cancel' | 'retry' | 'visit' | 'revoke';
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
