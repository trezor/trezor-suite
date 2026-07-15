import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    origin: AttributeDef<string>;
    method: AttributeDef<string>;
    appName: AttributeDef<string>;
    appUrl?: AttributeDef<string>;
    appEmail?: AttributeDef<string>;
    connectionType: AttributeDef<string>;
    npmVersion?: AttributeDef<string>;
};

export const connectPopupCallEvent: EventDef<Attributes, EventType.ConnectPopupCall> = {
    name: EventType.ConnectPopupCall,
    descriptionTrigger:
        'An external third-party application makes a request through the Connect Popup API',
    changelog: [{ version: '25.5.0', notes: 'added' }],
    attributes: {
        origin: {
            changelog: [{ version: '25.5.0', notes: 'added' }],
            description: 'Source of the call (URL)',
        },
        method: {
            changelog: [{ version: '25.5.0', notes: 'added' }],
            description: 'Connect method name',
        },
        appName: {
            changelog: [{ version: '26.2.0', notes: 'added' }],
            description: 'Source app name from manifest',
        },
        appUrl: {
            changelog: [{ version: '26.2.0', notes: 'added' }],
            description: 'Source app URL from manifest',
        },
        appEmail: {
            changelog: [{ version: '26.2.0', notes: 'added' }],
            description: 'Source app email from manifest',
        },
        npmVersion: {
            changelog: [{ version: '26.2.0', notes: 'added' }],
            description: 'Source app NPM version (if known)',
        },
        connectionType: {
            changelog: [{ version: '26.2.0', notes: 'added' }],
            description:
                'Source of the call: `desktop-ws`, `mcp`, `walletconnect`, `web`, or `deeplink`',
        },
    },
};
