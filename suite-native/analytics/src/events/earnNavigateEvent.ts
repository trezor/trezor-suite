import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export const earnNavigateEvent: EventDef<{}, EventType.EarnNavigate> = {
    name: EventType.EarnNavigate,
    descriptionTrigger: 'On Earn Page opened',
    changelog: [{ version: '26.1.2', notes: 'added' }],
    attributes: {},
};
