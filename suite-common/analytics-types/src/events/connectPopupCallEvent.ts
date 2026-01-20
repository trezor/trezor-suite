import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    origin: AttributeDef<string>;
    method: AttributeDef<string>;
};

export const connectPopupCallEvent: EventDef<Attributes, EventType.ConnectPopupCall> = {
    name: EventType.ConnectPopupCall,
    descriptionTrigger: 'Connect Popup call from 3rd party app',
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
    },
};
