import { DeviceModelInternal, FirmwareType } from '@trezor/connect';

export type AnalyticsSendFlowStep =
    | 'address_and_amount'
    | 'fee_settings'
    | 'address_review'
    | 'outputs_review'
    | 'destination_tag_review';

export type DeviceAuthenticityCheckResult = 'successful' | 'compromised' | 'cancelled' | 'failed';

export type FirmwareUpdatePayload = {
    model: DeviceModelInternal;
    fromBootloaderVersion: string;
    fromFwVersion: string;
    toFwVersion: string;
    fromFwType: FirmwareType | 'none';
    toFwType: FirmwareType;
};

export type FirmwareUpdateStuckedState = 'modalPart1' | 'modalPart2' | 'buttonVisible';
export type FirmwareUpdateStartType = 'normal' | 'retry';
