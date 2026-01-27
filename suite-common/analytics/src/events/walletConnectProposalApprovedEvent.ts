import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    origin?: AttributeDef<string>;
};

export const walletConnectProposalApprovedEvent: EventDef<
    Attributes,
    EventType.WalletConnectProposalApproved
> = {
    name: EventType.WalletConnectProposalApproved,
    descriptionTrigger: 'WalletConnect DApp connection request approved by user',
    changelog: [{ version: '25.5.0', notes: 'added' }],

    attributes: {
        origin: {
            changelog: [{ version: '25.5.0', notes: 'added' }],
            description: 'Source of the call (URL)',
        },
    },
};
