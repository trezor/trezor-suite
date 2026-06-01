import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export const earnNavigateEvent: EventDef<Record<never, never>, EventType.EarnNavigate> = {
    name: EventType.EarnNavigate,
    descriptionTrigger: 'User navigates to the Earn page to view earning opportunities',
    changelog: [{ version: '26.1.2', notes: 'added' }],
    attributes: {},
};
