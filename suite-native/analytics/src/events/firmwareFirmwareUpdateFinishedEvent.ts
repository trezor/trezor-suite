import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { type FirmwareType } from '@trezor/connect';
import { type DeviceModelInternal } from '@trezor/device-utils';

import { EventType } from '../constants';

type Attributes = {
    model: AttributeDef<DeviceModelInternal>;
    fromBootloaderVersion: AttributeDef<string>;
    fromFwVersion: AttributeDef<string>;
    toFwVersion: AttributeDef<string>;
    fromFwType: AttributeDef<FirmwareType | 'none'>;
    toFwType: AttributeDef<FirmwareType>;
    location: AttributeDef<'settings' | 'onboarding' | null>;
    duration: AttributeDef<number>;
    error?: AttributeDef<string | undefined>;
};

export const firmwareFirmwareUpdateFinishedEvent: EventDef<
    Attributes,
    EventType.FirmwareFirmwareUpdateFinished
> = {
    name: EventType.FirmwareFirmwareUpdateFinished,
    descriptionTrigger: 'Device firmware update completes, either successfully or with an error',
    changelog: [{ version: '25.5.1', notes: 'added attribute - @location (fw)' }],
    attributes: {
        model: {
            description: 'The device model identifier',
            changelog: [{ version: '25.5.1', notes: 'added' }],
        },
        fromBootloaderVersion: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'Bootloader version string before update (e.g., 1.2.3)',
        },
        fromFwVersion: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'Firmware version before update, or `none` if not applicable',
        },
        toFwVersion: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'Target firmware version (e.g., 1.2.3)',
        },
        fromFwType: {
            description: 'The firmware type before update: `bitcoin-only`, `universal`, or `none`',
            changelog: [{ version: '25.5.1', notes: 'added' }],
        },
        toFwType: {
            description: 'The target firmware type: `bitcoin-only` or `universal`',
            changelog: [{ version: '25.5.1', notes: 'added' }],
        },
        location: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description:
                'Where the firmware update was initiated: `settings` from settings screen, `onboarding` during device setup, or `null` if unknown',
        },
        duration: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'Duration of the firmware update process in seconds',
        },
        error: {
            description: 'Error message if the update failed, null or empty if successful',
            changelog: [{ version: '25.5.1', notes: 'added' }],
        },
    },
};
