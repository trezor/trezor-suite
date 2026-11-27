import { type AttributeDef, type EventDef } from '@suite-common/analytics';
import { type FeedbackCategory } from '@suite-common/feedback';

import { EventType } from '../constants';

type Attributes = {
    category: AttributeDef<FeedbackCategory>;
    context?: AttributeDef<string>;
    provider?: AttributeDef<string>;
    productId?: AttributeDef<string>;
    networkSymbol?: AttributeDef<string>;
    tokenSymbols?: AttributeDef<string[]>;
};

export const feedbackSentEvent: EventDef<Attributes, EventType.FeedbackSent> = {
    name: EventType.FeedbackSent,
    descriptionTrigger: 'User submits a feedback card',
    changelog: [{ version: '26.8.1', notes: 'added' }],

    attributes: {
        category: {
            description: 'Where the feedback card is shown, e.g. `trade`, `yield`, `staking`',
            changelog: [
                { version: '26.8.1', notes: 'added' },
                { version: '26.12.1', notes: 'documented staking completion feedback' },
            ],
        },
        context: {
            description:
                'Optional label for the feedback context; for trade feedback the trade type `buy`, `sell`, or `exchange`; for Earn feedback the operation, e.g. `stake`, `deposit`, or `wrap`',
            changelog: [
                { version: '26.8.1', notes: 'added' },
                { version: '26.12.1', notes: 'documented Earn operations' },
            ],
        },
        provider: {
            description:
                'Optional provider or identifier for the feedback context; the exchange provider for trade, the vault ID for yield',
            changelog: [
                { version: '26.8.1', notes: 'added' },
                { version: '26.11.0', notes: 'Yield completion feedback reports its vault id.' },
            ],
        },
        productId: {
            description: 'Staking product ID in the form network:asset:provider:type',
            changelog: [{ version: '26.12.1', notes: 'added' }],
        },
        networkSymbol: {
            description: 'Suite network symbol for a yield claim, wrap, or unwrap',
            changelog: [{ version: '26.12.1', notes: 'added' }],
        },
        tokenSymbols: {
            description:
                'Wrapped token symbol or the distinct reward token symbols for a yield claim',
            changelog: [{ version: '26.12.1', notes: 'added' }],
        },
    },
};
