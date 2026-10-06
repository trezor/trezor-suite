import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { type FeedbackCategory, type Rating } from '@suite-common/feedback';

import { EventType } from '../constants';

type Attributes = {
    rating: AttributeDef<Rating>;
    category: AttributeDef<FeedbackCategory>;
    context?: AttributeDef<string>;
    provider?: AttributeDef<string>;
};

export const feedbackRatingSelectedEvent: EventDef<Attributes, EventType.FeedbackRatingSelected> = {
    name: EventType.FeedbackRatingSelected,
    descriptionTrigger: 'User picks an emoji rating value in a feedback card',
    changelog: [{ version: '26.9.0', notes: 'added' }],

    attributes: {
        rating: {
            description: 'The selected rating value from `1` (worst) to `5` (best)',
            changelog: [{ version: '26.9.0', notes: 'added' }],
        },
        category: {
            description: 'Where the feedback card is shown, e.g. `trade`, `yield`, `staking`',
            changelog: [
                { version: '26.9.0', notes: 'added' },
                { version: '26.10.0', notes: 'added `staking` (Tron staking completion screens)' },
            ],
        },
        context: {
            description:
                'Optional label for the feedback context; for trade feedback the trade type `buy`, `sell`, or `exchange`; for yield the flow `deposit`, `withdraw`, or `claim`; for staking the Tron flow `tron-stake`, `tron-vote`, `tron-unstake`, `tron-withdraw`, or `tron-claim`',
            changelog: [
                { version: '26.9.0', notes: 'added' },
                { version: '26.10.0', notes: 'added the `tron-*` staking flow values' },
            ],
        },
        provider: {
            description:
                'Optional provider or identifier for the feedback context; the exchange provider for trade, the vault id for yield',
            changelog: [{ version: '26.9.0', notes: 'added' }],
        },
    },
};
