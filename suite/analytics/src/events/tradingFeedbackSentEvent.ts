import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export const tradingFeedbackSentEvent: EventDef<
    Record<never, never>,
    EventType.TradingFeedbackSent
> = {
    name: EventType.TradingFeedbackSent,
    descriptionTrigger: 'User submits the feedback form on the trade detail page',
    changelog: [{ version: '26.9.0', notes: 'added' }],
    attributes: {},
};
