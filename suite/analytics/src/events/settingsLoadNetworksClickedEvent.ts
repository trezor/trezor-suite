import type { AnalyticsPlatform, AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type LoadNetworksOrigin = 'network-settings';

type Attributes = {
    platform: AttributeDef<AnalyticsPlatform>;
    origin: AttributeDef<LoadNetworksOrigin>;
};

export const settingsLoadNetworksClickedEvent: EventDef<
    Attributes,
    EventType.SettingsLoadNetworksClicked
> = {
    name: EventType.SettingsLoadNetworksClicked,
    descriptionTrigger:
        'Desktop user clicks the Load networks button in Settings > Networks to start account discovery without leaving Settings',
    changelog: [{ version: '26.7.0', notes: 'added' }],

    attributes: {
        platform: {
            description: 'The platform where the button was clicked (`desktop`)',
            changelog: [{ version: '26.7.0', notes: 'added' }],
        },
        origin: {
            description: 'Where the button was clicked (`network-settings`)',
            changelog: [{ version: '26.7.0', notes: 'added' }],
        },
    },
};
