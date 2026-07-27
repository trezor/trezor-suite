import { type FirmwareRevision } from '@suite-common/suite-types';
import { type DeviceModelInternal, type FirmwareVersionString } from '@trezor/device-utils';

export type SupportChatUtmParams = {
    utm_model?: DeviceModelInternal;
    utm_fw?: FirmwareVersionString;
    utm_rev?: FirmwareRevision;
    utm_passphrase?: 'true' | 'false';
    utm_app?: string;
};
