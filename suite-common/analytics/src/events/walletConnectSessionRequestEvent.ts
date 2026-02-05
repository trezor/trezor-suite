import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    origin: AttributeDef<string>;
    chainId: AttributeDef<string>;
    method: AttributeDef<string>;
};

export const walletConnectSessionRequestEvent: EventDef<
    Attributes,
    EventType.WalletConnectSessionRequest
> = {
    name: EventType.WalletConnectSessionRequest,
    descriptionTrigger: 'WalletConnect DApp call to device',
    changelog: [{ version: '25.5.0', notes: 'added' }],

    attributes: {
        origin: {
            changelog: [{ version: '25.5.0', notes: 'added' }],
            description: 'Source of the call (URL)',
        },
        chainId: {
            changelog: [{ version: '25.5.0', notes: 'added' }],
            description: 'Connect method name',
        },
        method: {
            changelog: [{ version: '25.5.0', notes: 'added' }],
        },
    },
};
