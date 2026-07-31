import { type NetworkSymbol } from '@suite-common/wallet-config';

import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    networkSymbol: AttributeDef<NetworkSymbol>;
    type: AttributeDef<'custom' | 'default'>;
};

export const settingsNetworksExplorerEvent: EventDef<
    Attributes,
    EventType.SettingsNetworksExplorer
> = {
    name: EventType.SettingsNetworksExplorer,
    descriptionTrigger: 'User configures a custom network explorer or sets the default one',
    changelog: [{ version: '26.8.1', notes: 'added' }],

    attributes: {
        networkSymbol: {
            description: 'The symbol of the configured network (e.g. `btc`)',
            changelog: [{ version: '26.8.1', notes: 'added' }],
        },
        type: {
            description: 'The network explorer configured (`custom` or `default`)',
            changelog: [{ version: '26.8.1', notes: 'added' }],
        },
    },
};
