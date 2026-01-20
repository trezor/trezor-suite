import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    origin: AttributeDef<string>;
    method: AttributeDef<string>;
    error: AttributeDef<string>;
};

export const connectPopupErrorEvent: EventDef<Attributes, EventType.ConnectPopupError> = {
    name: EventType.ConnectPopupError,
    descriptionTrigger: 'Connect Popup call error',
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
        error: {
            changelog: [{ version: '25.5.0', notes: 'added' }],
            description: 'Error code',
        },
    },
};
