import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';
import { FirmwareUpdateLocation, FirmwareUpdateStartType } from '../definitions';

type FirmwareType = 'bitcoin-only' | 'universal';
type Location = 'settings' | 'onboarding';

type Attributes = {
    model: AttributeDef<string>;
    fromBootloaderVersion: AttributeDef<string>;
    fromFwVersion: AttributeDef<string>;
    toFwVersion: AttributeDef<string>;
    fromFwType: AttributeDef<FirmwareType | 'none'>;
    toFwType: AttributeDef<FirmwareType>;
    location: AttributeDef<FirmwareUpdateLocation | null>;
    startType: AttributeDef<FirmwareUpdateStartType>;
};

export const firmwareUpdateStartedEvent: EventDef<Attributes, EventType.FirmwareUpdateStarted> = {
    name: EventType.FirmwareUpdateStarted,
    descriptionTrigger: 'On starting update firmware flow or tapping Retry button.',
    changelog: [{ version: '25.1.2', notes: 'added' }],

    attributes: {
        model: {
            changelog: [{ version: '25.1.2', notes: 'added' }],
            description: 'Device model internal identifier',
        },
        fromBootloaderVersion: {
            changelog: [{ version: '25.1.2', notes: 'added' }],
            description: 'Bootloader version before update',
        },
        fromFwVersion: {
            changelog: [{ version: '25.1.2', notes: 'added' }],
            description: 'Firmware version before update',
        },
        toFwVersion: {
            changelog: [{ version: '25.1.2', notes: 'added' }],
            description: 'Target firmware version',
        },
        fromFwType: {
            changelog: [{ version: '25.1.2', notes: 'added' }],
            description: 'Firmware type before update',
        },
        toFwType: {
            changelog: [{ version: '25.1.2', notes: 'added' }],
            description: 'Target firmware type',
        },
        location: {
            changelog: [{ version: '25.1.2', notes: 'added' }],
            description: 'Location where the update was started',
        },
        startType: {
            changelog: [{ version: '25.1.2', notes: 'added' }],
            description: 'Started first time or is it retry?',
        },
    },
};
