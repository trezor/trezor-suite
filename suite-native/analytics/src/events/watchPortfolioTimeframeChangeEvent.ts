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
    descriptionTrigger:
        'User changes the timeframe for the portfolio balance chart (e.g., 1d, 1w, 1m, 6m, 1y, all)',
    changelog: [{ version: '23.4.1', notes: 'added' }],

    attributes: {
        timeframe: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description:
                'The selected timeframe for the portfolio graph (e.g., `1d` for 1 day, `1w` for 1 week, `1m` for 1 month, `6m` for 6 months, `1y` for 1 year, `all` for all time)',
        },
    },
};
