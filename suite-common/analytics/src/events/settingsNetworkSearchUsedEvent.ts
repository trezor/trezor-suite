import { EventType } from '../constants';
import type { AnalyticsPlatform, AttributeDef, EventDef } from '../eventDefinition';

type NetworkSettingsSearchOrigin = 'network-settings';

type Attributes = {
    platform: AttributeDef<AnalyticsPlatform>;
    origin: AttributeDef<NetworkSettingsSearchOrigin>;
};

export const settingsNetworkSearchUsedEvent: EventDef<
    Attributes,
    EventType.SettingsNetworkSearchUsed
> = {
    name: EventType.SettingsNetworkSearchUsed,
    descriptionTrigger:
        'User enters the first character in the network search input on Settings > Coins (once per search session)',
    changelog: [{ version: '26.7.0', notes: 'added' }],

    attributes: {
        platform: {
            description: 'The platform where the search was used (`desktop` or `mobile`)',
            changelog: [{ version: '26.7.0', notes: 'added' }],
        },
        origin: {
            description: 'Where the search was used (`network-settings`)',
            changelog: [{ version: '26.7.0', notes: 'added' }],
        },
    },
};
