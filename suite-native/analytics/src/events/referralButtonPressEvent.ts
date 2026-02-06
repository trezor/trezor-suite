import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {};

// @ts-expect-error deprecated event name (see `EventName` in `suite-common/analytics/src/eventDefinition.ts`)
export const referralButtonPressEvent: EventDef<Attributes, EventType.ReferralButtonPress> = {
    name: EventType.ReferralButtonPress,
    descriptionTrigger: 'Press referral button in homescreen',
    changelog: [{ version: '25.11.1', notes: 'added' }],
    attributes: {},
};
