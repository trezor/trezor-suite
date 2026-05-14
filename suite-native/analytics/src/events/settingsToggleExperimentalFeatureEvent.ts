import type { AttributeDef, EventDef } from '@suite-common/analytics';
import type { ExperimentalFeature } from '@suite-native/settings';

import { EventType } from '../constants';

type Attributes = {
    feature: AttributeDef<ExperimentalFeature>;
    value: AttributeDef<boolean>;
};

export const settingsToggleExperimentalFeatureEvent: EventDef<
    Attributes,
    EventType.SettingsToggleExperimentalFeature
> = {
    name: EventType.SettingsToggleExperimentalFeature,
    descriptionTrigger: 'On toggling an experimental feature in settings',
    changelog: [{ version: '26.4.1', notes: 'added' }],

    attributes: {
        feature: {
            changelog: [{ version: '26.4.1', notes: 'added' }],
            description: 'The identifier of the experimental feature',
        },
        value: {
            changelog: [{ version: '26.4.1', notes: 'added' }],
            description: 'Whether the experimental feature was enabled or disabled',
        },
    },
};
