import { type AttributeDef, type EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    timeframe: AttributeDef<string>;
};

export const watchPortfolioTimeframeChangeEvent: EventDef<
    Attributes,
    EventType.WatchPortfolioTimeframeChange
> = {
    name: EventType.WatchPortfolioTimeframeChange,
    descriptionTrigger: 'On every timeframe (scope) change of balance chart.',
    changelog: [{ version: '23.4.1', notes: 'added' }],

    attributes: {
        timeframe: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description: 'The selected timeframe for the portfolio graph',
        },
    },
};
