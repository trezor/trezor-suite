import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export const earnStablecoinYieldTilePressedEvent: EventDef<
    Record<never, never>,
    EventType.EarnStablecoinYieldTilePressed
> = {
    name: EventType.EarnStablecoinYieldTilePressed,
    descriptionTrigger: 'User taps the Earn Stablecoin Yield tile',
    changelog: [{ version: '26.2.1', notes: 'added' }],
    attributes: {},
};
