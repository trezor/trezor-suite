import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    firmware?: AttributeDef<'install' | 'update' | 'skip' | 'up-to-date'>;
    seed?: AttributeDef<'create' | 'recovery' | 'recovery-in-progress'>;
    seedType?: AttributeDef<'shamir-single' | 'shamir-advanced' | '12-words' | '24-words'>;

    wasSelectTypeOpened?: AttributeDef<boolean>;
    recoveryType?: AttributeDef<'standard' | 'advanced'>;

    backup?: AttributeDef<'create' | 'skip'>;
    pin?: AttributeDef<'create' | 'skip'>;

    duration: AttributeDef<number>;
    device: AttributeDef<string>;
    unitPackaging: AttributeDef<number>;
};

export const deviceSetupCompletedEvent: EventDef<Attributes, EventType.DeviceSetupCompleted> = {
    name: EventType.DeviceSetupCompleted,
    descriptionTrigger:
        'User successfully completes the device setup and onboarding flow in the application',
    changelog: [
        { version: '1.16.0', notes: 'added' },
        { version: '24.6.2', notes: 'updated' },
    ],

    attributes: {
        firmware: {
            changelog: [{ version: '1.16.0', notes: 'added' }],
            description:
                'Firmware action during setup: `install` for fresh install, `update` for version upgrade, `skip` if skipped, `up-to-date` if already current',
        },
        seed: {
            changelog: [{ version: '1.16.0', notes: 'added' }],
            description:
                'Seed setup method: `create` for new wallet creation, `recovery` for restoring existing wallet, `recovery-in-progress` if recovery was started but not completed',
        },
        seedType: {
            changelog: [{ version: '1.16.0', notes: 'added' }],
            description:
                'Type of seed phrase: `shamir-single` for single Shamir share, `shamir-advanced` for advanced Shamir, `12-words` for standard 12-word BIP39, `24-words` for 24-word BIP39',
        },
        wasSelectTypeOpened: {
            changelog: [{ version: '1.16.0', notes: 'added' }],
            description:
                '`true` if the user opened the seed type selection screen during setup, `false` if they used the default',
        },
        recoveryType: {
            changelog: [{ version: '1.16.0', notes: 'added' }],
            description:
                'Recovery method used: `standard` for basic recovery, `advanced` for advanced recovery options',
        },
        backup: {
            changelog: [{ version: '1.16.0', notes: 'added' }],
            description:
                'Backup creation during setup: `create` if backup was created, `skip` if backup step was skipped',
        },
        pin: {
            changelog: [{ version: '1.16.0', notes: 'added' }],
            description:
                'PIN setup during device setup: `create` if PIN was set, `skip` if PIN setup was skipped',
        },
        duration: {
            changelog: [{ version: '1.16.0', notes: 'added' }],
            description: 'Total time in milliseconds taken to complete the device setup process',
        },
        device: {
            changelog: [{ version: '1.16.0', notes: 'added' }],
            description: 'Device model identifier (e.g., `T2T1`, `T3T1`)',
        },
        unitPackaging: {
            changelog: [{ version: '1.16.0', notes: 'added' }],
            description: 'Packaging version or type identifier for the device unit',
        },
    },
};
