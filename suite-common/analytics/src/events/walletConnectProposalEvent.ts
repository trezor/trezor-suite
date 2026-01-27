import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    origin: AttributeDef<string>;
    validation: AttributeDef<'UNKNOWN' | 'VALID' | 'INVALID'>;
    networks: AttributeDef<string[]>;
};

export const walletConnectProposalEvent: EventDef<Attributes, EventType.WalletConnectProposal> = {
    name: EventType.WalletConnectProposal,
    descriptionTrigger: 'WalletConnect DApp requesting connection',
    changelog: [{ version: '25.5.0', notes: 'added' }],

    attributes: {
        origin: {
            changelog: [{ version: '25.5.0', notes: 'added' }],
            description: 'Source of the call (URL)',
        },
        validation: {
            changelog: [{ version: '25.5.0', notes: 'added' }],
        },
        networks: {
            changelog: [{ version: '25.5.0', notes: 'added' }],
        },
    },
};
