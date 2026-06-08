import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { type DeviceMode } from '@trezor/connect';
import { type DeviceModelInternal } from '@trezor/device-utils';
import type { VersionArray } from '@trezor/utils';

import { EventType } from '../constants';

type Attributes = {
    mode: AttributeDef<DeviceMode | null>;
    firmwareVersion: AttributeDef<VersionArray | null>;
    pinProtection: AttributeDef<boolean | null>;
    deviceModel: AttributeDef<DeviceModelInternal | null>;
    isBitcoinOnly: AttributeDef<boolean | null>;
    deviceLanguage: AttributeDef<string | null>;
    connectionType: AttributeDef<'cable' | 'bluetooth'>;
};

export const deviceConnectEvent: EventDef<Attributes, EventType.DeviceConnect> = {
    name: EventType.DeviceConnect,
    descriptionTrigger:
        'A Trezor device is successfully connected to the application and authorized for use',
    changelog: [
        { version: '25.5.1', notes: 'Added attribute: mode' },
        { version: '25.10.1', notes: 'Added attribute: connectionType' },
        { version: '25.11.1', notes: 'added' },
    ],
    attributes: {
        mode: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description:
                'The device mode (e.g., `normal`, `bootloader`, `initialize`, `seedless`), or null if unknown',
        },
        firmwareVersion: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description:
                'The firmware version installed on the device as a version array, or null if not available',
        },
        pinProtection: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description:
                'Whether PIN protection is enabled on the device: `true` if enabled, `false` if disabled, null if unknown',
        },
        deviceModel: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'The device model identifier (e.g., T1B1, T2T1), or null if unknown',
        },
        isBitcoinOnly: {
            changelog: [
                {
                    version: '24.11.1',
                    notes: 'Until 24.11.1 tracked btc-only devices; since 24.11.1 means btc-only firmware on any device. GitHub: trezor/trezor-suite#15145',
                },
            ],
        },
        deviceLanguage: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'The language set on the device, or null if not available',
        },
        connectionType: {
            changelog: [{ version: '25.10.1', notes: 'added' }],
            description:
                'The connection type used: `cable` for USB/wired connection, `bluetooth` for wireless connection',
        },
    },
};
