import { EventType } from '../constants';
import type { EventDef } from '../eventDefinition';

type Attributes = Record<never, never>;

export const connectPopupInitEvent: EventDef<Attributes, EventType.ConnectPopupInit> = {
    name: EventType.ConnectPopupInit,
    descriptionTrigger: 'Suite started with Connect Popup enabled',
    changelog: [{ version: '25.5.0', notes: 'added' }],
    attributes: {},
};
