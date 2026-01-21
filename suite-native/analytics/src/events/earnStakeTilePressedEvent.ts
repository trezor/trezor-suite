import type { EventDef } from '@suite-common/analytics-types';

import { EventType } from '../constants';

export const earnStakeTilePressedEvent: EventDef<undefined, EventType.EarnStakeTilePressed> = {
    name: EventType.EarnStakeTilePressed,
    descriptionTrigger: 'On Earn Stake Tile pressed',
    changelog: [{ version: '26.1.2', notes: 'added' }],
    attributes: undefined,
};
