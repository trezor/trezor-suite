import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

export type DeviceTutorialSource = 'settings';
export type DeviceTutorialResult = 'completed' | 'cancelled' | 'failed';

type Attributes = {
    source: AttributeDef<DeviceTutorialSource>;
    result: AttributeDef<DeviceTutorialResult>;
};

export const deviceLaunchTutorialEvent: EventDef<Attributes, EventType.DeviceLaunchTutorial> = {
    name: EventType.DeviceLaunchTutorial,
    descriptionTrigger:
        'Fired when the device tutorial launched outside of onboarding ends, whether finished, cancelled or failed.',
    description:
        'Measures how many users replay the device tutorial outside of onboarding and how many of them get through it.',
    changelog: [{ version: '26.12.0', notes: 'added' }],

    attributes: {
        source: {
            changelog: [{ version: '26.12.0', notes: 'added' }],
            description:
                'Where the tutorial was launched from. Currently always `settings` (device settings).',
        },
        result: {
            changelog: [{ version: '26.12.0', notes: 'added' }],
            description:
                '`completed` (the device reported success), `cancelled` (cancelled in the app or on the device) or `failed` (any other error).',
        },
    },
};
