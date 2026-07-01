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
    descriptionTrigger: 'User enables or disables an experimental feature in settings',
    changelog: [{ version: '26.4.1', notes: 'added' }],

    attributes: {
        feature: {
            changelog: [
                {
                    version: '26.4.1',
                    notes: 'added `tron-view-only` and `testnet-networks` values',
                },
                { version: '26.6.1', notes: 'removed `tron-view-only` value' },
                { version: '26.7.1', notes: 'removed `testnet-networks` value' },
            ],
            description: 'The identifier of the experimental feature being toggled',
        },
        value: {
            changelog: [{ version: '26.4.1', notes: 'added' }],
            description: '`true` if the experimental feature was enabled, `false` if disabled',
        },
    },
};
