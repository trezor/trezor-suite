import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    enabled: AttributeDef<boolean>;
};

export const settingsTestnetNetworksToggleEvent: EventDef<
    Attributes,
    EventType.SettingsTestnetNetworksToggle
> = {
    name: EventType.SettingsTestnetNetworksToggle,
    descriptionTrigger: 'User enables or disables Testnet networks in application settings',
    changelog: [{ version: '26.7.1', notes: 'added' }],

    attributes: {
        enabled: {
            changelog: [{ version: '26.7.1', notes: 'added' }],
            description: '`true` if Testnet networks are enabled, `false` if disabled',
        },
    },
};
