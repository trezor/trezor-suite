import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    origin?: AttributeDef<string>;
};

export const walletConnectProposalRejectedEvent: EventDef<
    Attributes,
    // @ts-expect-error deprecated event name (see `EventName` in `suite-common/analytics/src/eventDefinition.ts`)
    EventType.WalletConnectProposalRejected
> = {
    name: EventType.WalletConnectProposalRejected,
    descriptionTrigger: 'WalletConnect DApp connection request rejected by user',
    changelog: [{ version: '25.5.0', notes: 'added' }],

    attributes: {
        origin: {
            changelog: [{ version: '25.5.0', notes: 'added' }],
            description: 'Source of the call (URL)',
        },
    },
};
