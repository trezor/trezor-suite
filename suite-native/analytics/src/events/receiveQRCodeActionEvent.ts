import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type ReceiveQRCodeAction = 'copy' | 'save' | 'share';

type Attributes = {
    action: AttributeDef<ReceiveQRCodeAction>;
};

export const receiveQRCodeActionEvent: EventDef<Attributes, EventType.ReceiveQRCodeAction> = {
    name: EventType.ReceiveQRCodeAction,
    descriptionTrigger: 'User copies, saves, or shares a receive address QR code image',
    changelog: [{ version: '26.8.1', notes: 'added' }],
    attributes: {
        action: {
            description: 'The QR code image action: `copy`, `save`, or `share`',
            changelog: [{ version: '26.8.1', notes: 'added' }],
        },
    },
};
