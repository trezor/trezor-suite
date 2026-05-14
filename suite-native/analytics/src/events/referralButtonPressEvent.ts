import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const referralButtonPressEvent: EventDef<Attributes, EventType.ReferralButtonPress> = {
    name: EventType.ReferralButtonPress,
    descriptionTrigger: 'Press referral button in homescreen',
    changelog: [{ version: '25.11.1', notes: 'added' }],
    attributes: {},
};
