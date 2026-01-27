import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    origin: AttributeDef<string>;
    method: AttributeDef<string>;
    approved: AttributeDef<boolean>;
};

export const connectPopupPermissionsEvent: EventDef<Attributes, EventType.ConnectPopupPermissions> =
    {
        name: EventType.ConnectPopupPermissions,
        descriptionTrigger: 'Connect Popup permissions prompt',
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
            approved: {
                changelog: [{ version: '25.5.0', notes: 'added' }],
                description: 'Permission approval status',
            },
        },
    };
