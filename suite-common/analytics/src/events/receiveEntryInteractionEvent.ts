import { type NetworkSymbol } from '@suite-common/wallet-config';

import { EventType } from '../constants';
import type { AnalyticsPlatform, AttributeDef, EventDef } from '../eventDefinition';

export type ReceiveEntryInteractionAction =
    | 'assets-tab'
    | 'accounts-tab'
    | 'network-filter-open'
    | 'network-filter-select'
    | 'network-filter-clear'
    | 'right-network-link'
    | 'view-accounts';

type Attributes = {
    action: AttributeDef<ReceiveEntryInteractionAction>;
    platform: AttributeDef<AnalyticsPlatform>;
    networkSymbol?: AttributeDef<NetworkSymbol>;
};

export const receiveEntryInteractionEvent: EventDef<Attributes, EventType.ReceiveEntryInteraction> =
    {
        name: EventType.ReceiveEntryInteraction,
        descriptionTrigger:
            'Fired when a user interacts with the Global Receive entry modal. Emitted by desktop and mobile.',
        description:
            'Measures how users navigate between asset and account entry points and use network-selection guidance.',
        changelog: [{ version: '26.10.0', notes: 'added' }],

        attributes: {
            action: {
                description:
                    'The interaction: switching tabs, opening/selecting/clearing the network filter, opening the right-network guide, or switching to accounts from the asset no-results state.',
                changelog: [{ version: '26.10.0', notes: 'added' }],
            },
            platform: {
                description: '`desktop` or `mobile`, identifying which app emitted the event.',
                changelog: [{ version: '26.10.0', notes: 'added' }],
            },
            networkSymbol: {
                description: 'The selected network symbol; present for `network-filter-select`.',
                changelog: [{ version: '26.10.0', notes: 'added' }],
            },
        },
    };
