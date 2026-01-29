import type { DeviceModelInternal } from '@trezor/device-utils';

import { TREZOR_USB_DESCRIPTORS } from '../constants';

export type Config = {
    webusb: typeof TREZOR_USB_DESCRIPTORS;
    whitelist: Array<{ origin: string; priority: number }>;
    management: Array<{ origin: string }>;
    knownHosts: Array<{ origin: string; label: string }>;
    onionDomains: Record<string, string>;
    supportedBrowsers: Record<
        string,
        {
            version: number;
            download: string;
            update: string;
        }
    >;
    supportedFirmware: Array<{
        coin?: string[]; // Todo: better type?
        capabilities?: string[]; // Todo: better type?
        methods?: string[]; // Todo: better type?
        min: Partial<Record<DeviceModelInternal, string>>;
        max?: undefined; // NOTE: max field is not used anywhere at the moment, it is here for type compatibility
        comment?: string[];
    }>;
};
