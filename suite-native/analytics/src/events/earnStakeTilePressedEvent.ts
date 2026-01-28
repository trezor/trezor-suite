import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export const earnStakeTilePressedEvent: EventDef<{}, EventType.EarnStakeTilePressed> = {
    name: EventType.EarnStakeTilePressed,
    descriptionTrigger: 'On Earn Stake Tile pressed',
    changelog: [{ version: '26.1.2', notes: 'added' }],
    attributes: {},
};
