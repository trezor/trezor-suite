import { type DefinitionsVersion, getDefinitionsVersionForFirmware } from '@trezor/connect-common';

import type { Device } from '../device/Device';

export type { DefinitionsVersion };

export const getDefinitionsVersion = (device: Device): DefinitionsVersion =>
    getDefinitionsVersionForFirmware(device.getVersion());
