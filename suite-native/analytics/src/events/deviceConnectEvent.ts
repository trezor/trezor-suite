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
    descriptionTrigger: 'When device is successfully connected and authorized.',
    changelog: [
        { version: '25.5.1', notes: 'Added attribute: mode' },
        { version: '25.10.1', notes: 'Added attribute: connectionType' },
        { version: '25.11.1', notes: 'added' },
    ],
    attributes: {
        mode: { changelog: [{ version: '25.5.1', notes: 'added' }] },
        firmwareVersion: { changelog: [{ version: '25.5.1', notes: 'added' }] },
        pinProtection: { changelog: [{ version: '25.5.1', notes: 'added' }] },
        deviceModel: { changelog: [{ version: '25.5.1', notes: 'added' }] },
        isBitcoinOnly: {
            changelog: [
                {
                    version: '24.11.1',
                    notes: 'Until 24.11.1 tracked btc-only devices; since 24.11.1 means btc-only firmware on any device. GitHub: trezor/trezor-suite#15145',
                },
            ],
        },
        deviceLanguage: { changelog: [{ version: '25.5.1', notes: 'added' }] },
        connectionType: { changelog: [{ version: '25.10.1', notes: 'added' }] },
    },
};
