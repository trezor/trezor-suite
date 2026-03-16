import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { type DeviceModelInternal } from '@trezor/device-utils';

import { EventType } from '../constants';

type Attributes = {
    osName?: AttributeDef<string>;
    deviceModel?: AttributeDef<DeviceModelInternal | null>;
    duration?: AttributeDef<number>;
    seed?: AttributeDef<'create' | 'recovery'>;
    firmware?: AttributeDef<'install' | 'update' | 'skip' | 'up-to-date'>;
    seedType?: AttributeDef<'shamir-single' | 'shamir-advanced' | '12-words' | '24-words'>;
    recoveryStepBack?: AttributeDef<boolean>;
    wasBackupSkipped?: AttributeDef<boolean>;
    wasPinSkipped?: AttributeDef<boolean>;
};

export const deviceSetupCompletedEvent: EventDef<Attributes, EventType.DeviceSetupCompleted> = {
    name: EventType.DeviceSetupCompleted,
    descriptionTrigger: 'User successfully finished device onboarding flow.',
    changelog: [
        { version: '25.5.1', notes: 'added' },
        { version: '25.6.1', notes: 'added `recoveryStepBack` attribute' },
        { version: '25.7.1', notes: 'added `wasBackupSkipped`, `wasPinSkipped` attributes' },
    ],
    attributes: {
        osName: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'Operating system name (ios or android)',
        },
        deviceModel: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'Device model identifier',
        },
        duration: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'Duration of device setup in milliseconds',
        },
        seed: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'Describes if the seed was freshly generated or recovered from a backup',
        },
        firmware: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description:
                'Describes if the firmware was installed/updated etc. during the device onboarding flow',
        },
        seedType: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'Describes the type of backup used for wallet in onboarding flow',
        },
        recoveryStepBack: {
            changelog: [{ version: '25.6.1', notes: 'added' }],
            description: 'Whether user stepped back to previous screen during recovery',
        },
        wasBackupSkipped: {
            changelog: [{ version: '25.7.1', notes: 'added' }],
        },
        wasPinSkipped: {
            changelog: [{ version: '25.7.1', notes: 'added' }],
        },
    },
};
