import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { type Rating } from '@suite-common/feedback';
import { type TradingType } from '@suite-common/trading';

import { EventType } from '../constants';

type Attributes = {
    rating: AttributeDef<Rating>;
    type: AttributeDef<TradingType>;
};

export const tradingFeedbackRatingSelectedEvent: EventDef<
    Attributes,
    EventType.TradingFeedbackRatingSelected
> = {
    name: EventType.TradingFeedbackRatingSelected,
    descriptionTrigger:
        'User picks an emoji rating value in the feedback card on the trade detail screen',
    changelog: [{ version: '26.8.1', notes: 'added' }],

    attributes: {
        rating: {
            description: 'The selected rating value from `1` (worst) to `5` (best)',
            changelog: [{ version: '26.8.1', notes: 'added' }],
        },
        type: {
            description:
                'The type of trade the feedback form relates to: `buy`, `sell`, or `exchange`',
            changelog: [{ version: '26.8.1', notes: 'added' }],
        },
    },
};
