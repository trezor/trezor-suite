import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    entity_type: AttributeDef<'wallet' | 'account' | 'receive_address' | 'output'>;
    network?: AttributeDef<string>;
    action: AttributeDef<'created' | 'edited'>;
};

export const suiteSyncLabelCreatedEvent: EventDef<Attributes, EventType.SuiteSyncLabelCreated> = {
    name: EventType.SuiteSyncLabelCreated,
    descriptionTrigger: 'When user saves a non-empty label to any entity in Suite Sync',
    changelog: [{ version: '26.4.1', notes: 'added' }],
    attributes: {
        entity_type: {
            changelog: [{ version: '26.4.1', notes: 'added' }],
            description:
                'The type of entity being labeled: wallet, account, receive_address, or output',
        },
        network: {
            changelog: [{ version: '26.4.1', notes: 'added' }],
            description:
                'The coin/network of the labeled entity. Omitted for wallet labels as wallets are network-agnostic.',
        },
        action: {
            changelog: [{ version: '26.4.1', notes: 'added' }],
            description:
                'Whether the label was created for the first time or an existing label was edited.',
        },
    },
};
