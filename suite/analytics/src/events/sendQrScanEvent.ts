import type { AttributeDef, EventDef } from '@suite-common/analytics-types';

import { EventType } from '../constants';

type Attributes = {
    scheme: AttributeDef<string>;
    isAmountPresent: AttributeDef<boolean>;
    networkSymbol: AttributeDef<string>;
};

export const sendQrScanEvent: EventDef<Attributes, EventType.SendQrScan> = {
    name: EventType.SendQrScan,
    descriptionTrigger: 'User scans the QR code in send form',
    changelog: [{ version: '25.12.0', notes: 'added' }],

    attributes: {
        scheme: {
            changelog: [{ version: '25.12.0', notes: 'added' }],
        },
        isAmountPresent: {
            changelog: [{ version: '25.12.0', notes: 'added' }],
        },
        networkSymbol: {
            changelog: [{ version: '25.12.0', notes: 'added' }],
            description: "e.g. 'btc', 'eth', 'sol' etc.",
        },
    },
};
