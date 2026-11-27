import { type AttributeDef, type EventDef } from '@suite-common/analytics';
import { type FeedbackCategory, type Rating } from '@suite-common/feedback';

import { EventType } from '../constants';

type Attributes = {
    rating: AttributeDef<Rating>;
    category: AttributeDef<FeedbackCategory>;
    context?: AttributeDef<string>;
    provider?: AttributeDef<string>;
    productId?: AttributeDef<string>;
    networkSymbol?: AttributeDef<string>;
    tokenSymbols?: AttributeDef<string[]>;
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
                'Optional label for the feedback context; for trade feedback the trade type `buy`, `sell`, or `exchange`; for Earn feedback the operation, e.g. `stake`, `vote`, `deposit`, or `wrap`',
            changelog: [
                { version: '26.9.0', notes: 'added' },
                { version: '26.10.0', notes: 'added the `tron-*` staking flow values' },
                { version: '26.12.0', notes: 'replaced `tron-*` with the staking operation name' },
            ],
        },
        provider: {
            description:
                'Optional provider or identifier for the feedback context; the exchange provider for trade, the vault id for yield',
            changelog: [{ version: '26.9.0', notes: 'added' }],
        },
        productId: {
            description: 'Optional staking product ID in the form network:asset:provider:type',
            changelog: [{ version: '26.12.0', notes: 'added' }],
        },
        networkSymbol: {
            description: 'Suite network symbol for a yield claim, wrap, or unwrap',
            changelog: [{ version: '26.12.0', notes: 'added' }],
        },
        tokenSymbols: {
            description:
                'Wrapped token symbol or the distinct reward token symbols for a yield claim',
            changelog: [{ version: '26.12.0', notes: 'added' }],
        },
    },
};
