import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    isAmountPresent: AttributeDef<boolean>;
    scheme: AttributeDef<string>;
};

export const appUriHandlerEvent: EventDef<Attributes, EventType.AppUriHandler> = {
    name: EventType.AppUriHandler,
    descriptionTrigger:
        'App is launched using uri handler or uri handler is opened when app is already running',
    changelog: [
        { version: '23.2.1', notes: 'added' },
        {
            version: '25.12.0',
            notes: 'It is no longer includes QR code scans inside the app, there’s separate event for that: send/qr-scan',
        },
    ],

    attributes: {
        isAmountPresent: {
            changelog: [{ version: '23.2.1', notes: 'added' }],
        },
        scheme: {
            changelog: [{ version: '23.2.1', notes: 'added' }],
        },
    },
};
