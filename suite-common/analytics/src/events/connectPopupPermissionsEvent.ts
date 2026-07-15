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
        descriptionTrigger: 'User approves or denies permissions in the Connect popup dialog',
        changelog: [{ version: '25.5.0', notes: 'added' }],
        attributes: {
            origin: {
                changelog: [{ version: '25.5.0', notes: 'added' }],
                description: 'The URL or origin of the application requesting permissions',
            },
            method: {
                changelog: [{ version: '25.5.0', notes: 'added' }],
                description: 'The specific method or permission being requested',
            },
            approved: {
                changelog: [{ version: '25.5.0', notes: 'added' }],
                description:
                    'Whether the user approved (`true`) or denied (`false`) the requested permissions',
            },
        },
    };
