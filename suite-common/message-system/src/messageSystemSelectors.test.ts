import { createMessageSystemState } from './__fixtures__/createMessageSystemState';
import { messageSystemInitialState } from './messageSystemReducer';
import {
    selectAllConfigExperiments,
    selectAllTradingDisabledMessageContent,
    selectAllValidConfigExperiments,
    selectIsAllTradingDisabled,
    selectIsExperimentValid,
} from './messageSystemSelectors';
import {
    ExperimentId,
    Feature,
    type FeatureDomain,
    type MessageSystemRootState,
} from './messageSystemTypes';

const createState = (validExperiments: string[]) =>
    ({
        messageSystem: { ...createMessageSystemState(), validExperiments },
    }) as unknown as MessageSystemRootState;

describe('experiment selectors', () => {
    it('selects all config experiments regardless of validity', () => {
        const state = createState([]);

        expect(selectAllConfigExperiments(state)).toHaveLength(1);
    });

    it('selects only valid config experiments with their conditions', () => {
        expect(selectAllValidConfigExperiments(createState([]))).toEqual([]);
        expect(
            selectAllValidConfigExperiments(createState([ExperimentId.tradingFeedbackForm])),
        ).toEqual([
            expect.objectContaining({
                conditions: [],
                experiment: expect.objectContaining({ id: ExperimentId.tradingFeedbackForm }),
            }),
        ]);
    });

    it('selects whether an experiment is valid', () => {
        const state = createState([ExperimentId.tradingFeedbackForm]);

        expect(selectIsExperimentValid(state, ExperimentId.tradingFeedbackForm)).toBe(true);
        expect(selectIsExperimentValid(state, 'unknown-experiment')).toBe(false);
    });
});

type DisablingMessage = {
    id: string;
    text: string;
    domains: FeatureDomain[];
    enabledDomains?: FeatureDomain[];
    priority?: number;
};

const createDisabledFeaturesState = (messages: DisablingMessage[]): MessageSystemRootState => ({
    messageSystem: {
        ...messageSystemInitialState,
        validMessages: {
            ...messageSystemInitialState.validMessages,
            feature: messages.map(({ id }) => id),
        },
        config: {
            version: 1,
            timestamp: '1970-01-01T00:00:00Z',
            sequence: 1,
            actions: messages.map(({ id, text, domains, enabledDomains = [], priority = 1 }) => ({
                conditions: [{}],
                message: {
                    id,
                    priority,
                    dismissible: false,
                    variant: 'warning',
                    category: 'feature',
                    content: { en: text, es: text, cs: text, de: text, fr: text, pt: text },
                    feature: [
                        ...domains.map(domain => ({ domain, flag: false })),
                        ...enabledDomains.map(domain => ({ domain, flag: true })),
                    ],
                },
            })),
        },
    },
});

const { buy, sell, exchange } = Feature.trading;

describe('all trading disabled selectors', () => {
    it('keeps trading enabled when no message disables it', () => {
        const state = createDisabledFeaturesState([]);

        expect(selectIsAllTradingDisabled(state)).toBe(false);
        expect(selectAllTradingDisabledMessageContent(state, 'en')).toBeUndefined();
    });

    it('keeps trading enabled while at least one type remains available', () => {
        const state = createDisabledFeaturesState([
            { id: 'partial', text: 'Buy and sell are off.', domains: [buy, sell] },
        ]);

        expect(selectIsAllTradingDisabled(state)).toBe(false);
        expect(selectAllTradingDisabledMessageContent(state, 'en')).toBeUndefined();
    });

    it('returns the message text when one message disables all types', () => {
        const state = createDisabledFeaturesState([
            { id: 'all', text: 'Trading is off.', domains: [buy, sell, exchange] },
        ]);

        expect(selectIsAllTradingDisabled(state)).toBe(true);
        expect(selectAllTradingDisabledMessageContent(state, 'en')).toBe('Trading is off.');
    });

    it('returns no text when different messages disable the types, even with the same text', () => {
        const state = createDisabledFeaturesState([
            { id: 'buy-sell', text: 'Off.', domains: [buy, sell] },
            { id: 'exchange', text: 'Off.', domains: [exchange] },
        ]);

        expect(selectIsAllTradingDisabled(state)).toBe(true);
        expect(selectAllTradingDisabledMessageContent(state, 'en')).toBeUndefined();
    });

    it('returns no text when the shared message leaves one type enabled', () => {
        const state = createDisabledFeaturesState([
            {
                id: 'mixed',
                text: 'Buy and sell are off.',
                domains: [buy, sell],
                enabledDomains: [exchange],
            },
        ]);

        expect(selectIsAllTradingDisabled(state)).toBe(false);
        expect(selectAllTradingDisabledMessageContent(state, 'en')).toBeUndefined();
    });

    it('follows the highest-priority message of each type', () => {
        const state = createDisabledFeaturesState([
            { id: 'all', text: 'Trading is off.', domains: [buy, sell, exchange] },
            {
                id: 'exchange-on',
                text: 'Swap is back.',
                domains: [],
                enabledDomains: [exchange],
                priority: 2,
            },
        ]);

        expect(selectIsAllTradingDisabled(state)).toBe(false);
        expect(selectAllTradingDisabledMessageContent(state, 'en')).toBeUndefined();
    });
});
