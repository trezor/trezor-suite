import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';
import { type FirmwareSource } from '../definitions';

type Attributes = {
    mode: AttributeDef<'normal' | 'bootloader' | 'initialize' | 'seedless'>;
    firmware: AttributeDef<string>;
    firmwareSource: AttributeDef<FirmwareSource>;
    bootloader?: AttributeDef<string>;
    pin_protection?: AttributeDef<boolean | null>;
    passphrase_protection?: AttributeDef<boolean | null>;
    totalInstances?: AttributeDef<number | null>;
    backup_type?: AttributeDef<string>;
    isBitcoinOnly?: AttributeDef<boolean>;
    isBitcoinOnlyDevice?: AttributeDef<boolean>;
    totalDevices?: AttributeDef<number>;
    language?: AttributeDef<string | null>;
    model?: AttributeDef<string>;
    firmwareRevision?: AttributeDef<string>;
    bootloaderHash?: AttributeDef<string>;
    optiga_sec?: AttributeDef<number>;
    connectionType?: AttributeDef<'cable' | 'bluetooth'>;
};

export const deviceConnectEvent: EventDef<Attributes, EventType.DeviceConnect> = {
    name: EventType.DeviceConnect,
    descriptionTrigger: 'Fired when device is connected.',
    possibleImprovements: '`totalInstances` does not make sense with current fire conditions',
    changelog: [
        { version: '1.0.0', notes: 'added' },
        { version: '25.10.1', notes: 'updated' },
    ],

    attributes: {
        mode: {
            changelog: [{ version: '1.0.0', notes: 'added' }],
        },
        firmware: {
            changelog: [{ version: '1.0.0', notes: 'added' }],
        },
        firmwareSource: {
            changelog: [{ version: '25.4.1', notes: 'added' }],
        },
        bootloader: {
            changelog: [{ version: '1.18.0', notes: 'added' }],
        },
        pin_protection: {
            changelog: [{ version: '1.0.0', notes: 'added' }],
        },
        passphrase_protection: {
            changelog: [{ version: '1.0.0', notes: 'added' }],
        },
        totalInstances: {
            changelog: [{ version: '1.0.0', notes: 'added' }],
            description:
                'Number of wallets loaded. This number is bigger than `totalDevices` only if a device with more wallets is loaded and then another device is loaded.',
        },
        backup_type: {
            changelog: [
                { version: '1.0.0', notes: 'added' },
                { version: '24.6.1', notes: 'updated' },
            ],
            description: `There is a reported [bug](https://github.com/trezor/trezor-firmware/issues/5147), which probably leads to device almost never reports Slip39_Single_Extendable and always reports Slip39_Basic_Extendable even if it's a single backup.
                Values are taken directly from device, FW protocol docs define them like this:

\`\`\`
enum BackupType {
    Bip39 = 0;                       // also called "Single Backup", see BIP-0039
    Slip39_Basic = 1;                // also called "Shamir Backup", see SLIP-0039
    Slip39_Advanced = 2;             // also called "Super Shamir" or "Shamir with Groups", see SLIP-0039#two-level-scheme
    Slip39_Single_Extendable = 3;    // extendable single-share Shamir backup
    Slip39_Basic_Extendable = 4;     // extendable multi-share Shamir backup
    Slip39_Advanced_Extendable = 5;  // extendable multi-share Shamir backup with groups
}
\`\`\`

Possible backup types:

- Bip39
- Slip39_Basic *(Shamir)*
- Slip39_Advanced *(Shamir)* = ??SuperShamir, user would have had to create it outside Suite
- Slip39_Single_Extendable = 1of1
- Slip39_Basic_Extendable = M of N for N > 1
- Slip39_Advanced_Extendable = ??SuperShamir, user would have had to create it outside Suite`,
        },
        isBitcoinOnly: {
            changelog: [{ version: '1.6.0', notes: 'added' }],
        },
        isBitcoinOnlyDevice: {
            changelog: [{ version: '25.4.1', notes: 'added' }],
        },
        totalDevices: {
            changelog: [{ version: '1.7.0', notes: 'added' }],
            description:
                'Number of unique devices (connected at the same time or remembered but not connected at the same time)',
        },
        language: {
            changelog: [{ version: '1.9.0', notes: 'added' }],
            description: 'Device language, string (`en-US`)',
        },
        model: {
            changelog: [
                { version: '1.9.0', notes: 'added' },
                {
                    version: '23.8.0',
                    notes: 'In `23.8.0` changed - model now reports `T1B1` for `1` , `T2T1` for `T` and `T2B1` for `R`',
                },
            ],
        },
        firmwareRevision: {
            changelog: [{ version: '1.18.0', notes: 'added' }],
        },
        bootloaderHash: {
            changelog: [{ version: '1.18.0', notes: 'added' }],
        },
        optiga_sec: {
            changelog: [{ version: '?', notes: 'added' }],
        },
        connectionType: {
            changelog: [{ version: '25.10.1', notes: 'added' }],
        },
    },
};
