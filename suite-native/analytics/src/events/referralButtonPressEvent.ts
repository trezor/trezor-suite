import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export const referralButtonPressEvent: EventDef<{}, EventType.ReferralButtonPress> = {
    name: EventType.ReferralButtonPress,
    descriptionTrigger: 'Press referral button in homescreen',
    changelog: [{ version: '25.11.1', notes: 'added' }],
    attributes: {},
};
