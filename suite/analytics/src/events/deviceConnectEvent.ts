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
    descriptionTrigger: 'A device is connected to the application',
    possibleImprovements: '`totalInstances` does not make sense with current fire conditions',
    changelog: [
        { version: '1.0.0', notes: 'added' },
        { version: '25.10.1', notes: 'updated' },
    ],

    attributes: {
        mode: {
            description:
                'The device mode: `normal` for regular operation, `bootloader` for firmware update mode, `initialize` for initial setup, `seedless` for seedless operation',
            changelog: [{ version: '1.0.0', notes: 'added' }],
        },
        firmware: {
            description: 'The firmware version currently installed on the device',
            changelog: [{ version: '1.0.0', notes: 'added' }],
        },
        firmwareSource: {
            description:
                'The source or type of firmware (e.g., `NA - bootloader`, `official`, `unknown`)',
            changelog: [{ version: '25.4.1', notes: 'added' }],
        },
        bootloader: {
            description: 'The bootloader version if available',
            changelog: [{ version: '1.18.0', notes: 'added' }],
        },
        pin_protection: {
            description:
                'Whether PIN protection is enabled on the device: `true` if enabled, `false` if disabled, null if unknown',
            changelog: [{ version: '1.0.0', notes: 'added' }],
        },
        passphrase_protection: {
            description:
                'Whether passphrase protection is enabled on the device: `true` if enabled, `false` if disabled, null if unknown',
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
            description: 'Whether this device instance is configured to handle Bitcoin only',
            changelog: [{ version: '1.6.0', notes: 'added' }],
        },
        isBitcoinOnlyDevice: {
            description: 'Whether the device model is a Bitcoin-only variant',
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
            description:
                'The device model identifier (e.g., `T1B1` for Trezor One, `T2T1` for Trezor Model T, `T2B1` for Trezor Model R)',
            changelog: [
                { version: '1.9.0', notes: 'added' },
                {
                    version: '23.8.0',
                    notes: 'In `23.8.0` changed - model now reports `T1B1` for `1` , `T2T1` for `T` and `T2B1` for `R`',
                },
            ],
        },
        firmwareRevision: {
            description: 'The firmware revision string containing detailed version information',
            changelog: [{ version: '1.18.0', notes: 'added' }],
        },
        bootloaderHash: {
            description: 'The hash of the bootloader for verification purposes',
            changelog: [{ version: '1.18.0', notes: 'added' }],
        },
        optiga_sec: {
            description: 'The OPTIGA secure element security level or status on the device',
            changelog: [{ version: '24.8.1', notes: 'added' }],
        },
        connectionType: {
            description:
                'How the device is connected: `cable` for USB connection, `bluetooth` for wireless connection',
            changelog: [{ version: '25.10.1', notes: 'added' }],
        },
    },
};
