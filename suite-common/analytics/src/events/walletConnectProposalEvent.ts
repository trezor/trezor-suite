import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    origin: AttributeDef<string>;
    validation: AttributeDef<'UNKNOWN' | 'VALID' | 'INVALID'>;
    networks: AttributeDef<string[]>;
};

export const walletConnectProposalEvent: EventDef<Attributes, EventType.WalletConnectProposal> = {
    name: EventType.WalletConnectProposal,
    descriptionTrigger: 'A WalletConnect DApp requests permission to establish a connection',
    changelog: [{ version: '25.5.0', notes: 'added' }],

    attributes: {
        origin: {
            changelog: [{ version: '25.5.0', notes: 'added' }],
            description: 'The URL or origin of the DApp requesting the connection',
        },
        validation: {
            changelog: [{ version: '25.5.0', notes: 'added' }],
            description:
                'The validation status of the DApp: `VALID` if verified, `INVALID` if verification failed, `UNKNOWN` if not yet verified',
        },
        networks: {
            changelog: [{ version: '25.5.0', notes: 'added' }],
            description: 'List of blockchain networks that the DApp is requesting access to',
        },
    },
};
