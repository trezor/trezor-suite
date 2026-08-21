import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    status: AttributeDef<'success' | 'error' | 'cancelled'>;
    error?: AttributeDef<string>;
    symbol: AttributeDef<string>;
    hex: AttributeDef<boolean>;
};

export const coinVerifyMessageEvent: EventDef<Attributes, EventType.CoinVerifyMessage> = {
    name: EventType.CoinVerifyMessage,
    descriptionTrigger:
        'User submits the Verify form on the Sign & Verify Messages screen, once per attempt. Never carries the message, the address or the signature.',
    changelog: [{ version: '26.9.0', notes: 'added' }],

    attributes: {
        status: {
            description:
                'The verification result: `success` when the signature matched, `cancelled` when the user rejected the request in the popup or on the device, `error` for a mismatched signature or any other failure',
            changelog: [{ version: '26.9.0', notes: 'added' }],
        },
        error: {
            description:
                'The Connect error code, or its message when no code is available. Not sent when verification succeeded',
            changelog: [{ version: '26.9.0', notes: 'added' }],
        },
        symbol: {
            description:
                'The blockchain network symbol of the verifying account: `btc` for Bitcoin, `eth` for Ethereum, etc.',
            changelog: [{ version: '26.9.0', notes: 'added' }],
        },
        hex: {
            description: 'Whether the message was entered as hex instead of text',
            changelog: [{ version: '26.9.0', notes: 'added' }],
        },
    },
};
