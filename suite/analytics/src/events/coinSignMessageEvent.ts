import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    status: AttributeDef<'success' | 'error' | 'cancelled'>;
    error?: AttributeDef<string>;
    symbol: AttributeDef<string>;
    hex: AttributeDef<boolean>;
    signatureFormat?: AttributeDef<'trezor' | 'electrum'>;
};

export const coinSignMessageEvent: EventDef<Attributes, EventType.CoinSignMessage> = {
    name: EventType.CoinSignMessage,
    descriptionTrigger:
        'User submits the Sign form on the Sign & Verify Messages screen, once per attempt. Never carries the message, the address or the signature.',
    changelog: [{ version: '26.9.0', notes: 'added' }],

    attributes: {
        status: {
            description:
                'The signing result: `success` when the device returned a signature, `cancelled` when the user rejected the request in the popup or on the device, `error` for any other failure',
            changelog: [{ version: '26.9.0', notes: 'added' }],
        },
        error: {
            description:
                'The Connect error code, or its message when no code is available. Not sent when signing succeeded',
            changelog: [{ version: '26.9.0', notes: 'added' }],
        },
        symbol: {
            description:
                'The blockchain network symbol of the signing account: `btc` for Bitcoin, `eth` for Ethereum, etc.',
            changelog: [{ version: '26.9.0', notes: 'added' }],
        },
        hex: {
            description: 'Whether the message was entered as hex instead of text',
            changelog: [{ version: '26.9.0', notes: 'added' }],
        },
        signatureFormat: {
            description:
                'The selected signature format: `electrum` when the Electrum-compatible format was chosen, `trezor` otherwise. Sent only by accounts that are offered the choice: non-legacy accounts of Bitcoin-like networks that have more than the `normal` account type, such as `btc` and `ltc`. Left out by legacy accounts, by single-account-type coins like `bch`, `doge` and `zec`, and by networks signing in one format such as `eth` and `ada`',
            changelog: [{ version: '26.9.0', notes: 'added' }],
        },
    },
};
