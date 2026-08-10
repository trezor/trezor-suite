import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export const tradingFeedbackSentEvent: EventDef<
    Record<never, never>,
    EventType.TradingFeedbackSent
> = {
    name: EventType.TradingFeedbackSent,
    descriptionTrigger: 'User submits the feedback form on the trade detail screen',
    changelog: [{ version: '26.8.1', notes: 'added' }],
    attributes: {},
};
