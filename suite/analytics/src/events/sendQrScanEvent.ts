import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    scheme: AttributeDef<string>;
    isAmountPresent: AttributeDef<boolean>;
    networkSymbol: AttributeDef<string>;
};

export const sendQrScanEvent: EventDef<Attributes, EventType.SendQrScan> = {
    name: EventType.SendQrScan,
    descriptionTrigger:
        'User scans a QR code in the send form to populate recipient address and optional amount',
    changelog: [{ version: '25.12.0', notes: 'added' }],

    attributes: {
        scheme: {
            changelog: [{ version: '25.12.0', notes: 'added' }],
            description:
                'The URI scheme detected in the QR code (e.g., `bitcoin`, `ethereum`, `solana`)',
        },
        isAmountPresent: {
            changelog: [{ version: '25.12.0', notes: 'added' }],
            description:
                'Whether the QR code contained an amount value (`true`) or only address information (`false`)',
        },
        networkSymbol: {
            changelog: [{ version: '25.12.0', notes: 'added' }],
            description: `Blockchain network symbol for the scanned QR code (e.g. 'btc', 'eth', 'sol')`,
        },
    },
};
