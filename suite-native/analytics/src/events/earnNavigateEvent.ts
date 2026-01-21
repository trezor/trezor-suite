import type { EventDef } from '@suite-common/analytics-types';

import { EventType } from '../constants';

export const earnNavigateEvent: EventDef<undefined, EventType.EearnNavigate> = {
    name: EventType.EearnNavigate,
    descriptionTrigger: 'On Earn Page opened',
    changelog: [{ version: '26.1.2', notes: 'added' }],
    attributes: undefined,
};
