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
    descriptionTrigger: 'User changes the timeframe for the portfolio balance chart (e.g., 1D, 7D, 1M, 1Y, All)',
    changelog: [{ version: '23.4.1', notes: 'added' }],

    attributes: {
        timeframe: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description: 'The selected timeframe for the portfolio graph (e.g., "1D" for 1 day, "7D" for 7 days, "1M" for 1 month, "1Y" for 1 year, "ALL" for all time)',
        },
    },
};
