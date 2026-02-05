import { EventType } from '../constants';
import type { EventDef } from '../eventDefinition';

type Attributes = {};

// @ts-expect-error deprecated event name (see `EventName` in `suite-common/analytics/src/eventDefinition.ts`)
export const connectPopupInitEvent: EventDef<Attributes, EventType.ConnectPopupInit> = {
    name: EventType.ConnectPopupInit,
    descriptionTrigger: 'Suite started with Connect Popup enabled',
    changelog: [{ version: '25.5.0', notes: 'added' }],
    attributes: {},
};
