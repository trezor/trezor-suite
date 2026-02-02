import type { AttributeDef, EventDef } from '@suite-common/analytics';
import type { DeviceModelInternal } from '@trezor/device-utils';

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
    descriptionTrigger: 'User completes device setup (onboarding).',
    changelog: [{ version: '1.0.0', notes: 'added' }],
    attributes: {
        osName: { changelog: [{ version: '1.0.0', notes: 'added' }] },
        deviceModel: { changelog: [{ version: '1.0.0', notes: 'added' }] },
        duration: { changelog: [{ version: '1.0.0', notes: 'added' }] },
        seed: { changelog: [{ version: '1.0.0', notes: 'added' }] },
        firmware: { changelog: [{ version: '1.0.0', notes: 'added' }] },
        seedType: { changelog: [{ version: '1.0.0', notes: 'added' }] },
        recoveryStepBack: { changelog: [{ version: '1.0.0', notes: 'added' }] },
        wasBackupSkipped: { changelog: [{ version: '1.0.0', notes: 'added' }] },
        wasPinSkipped: { changelog: [{ version: '1.0.0', notes: 'added' }] },
    },
};
