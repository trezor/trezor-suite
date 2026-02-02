import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export const referralButtonPressEvent: EventDef<{}, EventType.ReferralButtonPress> = {
    name: EventType.ReferralButtonPress,
    descriptionTrigger: 'User presses referral button.',
    changelog: [{ version: '1.0.0', notes: 'added' }],
    attributes: {},
};
