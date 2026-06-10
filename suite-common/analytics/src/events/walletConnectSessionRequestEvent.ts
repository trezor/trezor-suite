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
    descriptionTrigger:
        'A WalletConnect DApp session request is successfully responded to by the device. Only successful responses are reported; requests that throw an error are not.',
    changelog: [{ version: '25.5.0', notes: 'added' }],

    attributes: {
        origin: {
            changelog: [{ version: '25.5.0', notes: 'added' }],
            description: 'The origin or URL of the DApp making the request',
        },
        chainId: {
            changelog: [{ version: '25.5.0', notes: 'added' }],
            description: 'The blockchain chain ID for which the session request is intended',
        },
        method: {
            changelog: [{ version: '25.5.0', notes: 'added' }],
            description:
                'The WalletConnect RPC method name being requested (e.g., `eth_sign`, `eth_sendTransaction`)',
        },
    },
};
