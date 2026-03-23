import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export const earnStablecoinYieldTilePressedEvent: EventDef<
    {},
    EventType.EarnStablecoinYieldTilePressed
> = {
    name: EventType.EarnStablecoinYieldTilePressed,
    descriptionTrigger: 'On Earn Stablecoin Yield Tile pressed',
    changelog: [{ version: '26.2.1', notes: 'added' }],
    attributes: {},
};
