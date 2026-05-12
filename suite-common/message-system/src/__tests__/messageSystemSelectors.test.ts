import { messageSystemInitialState } from '../messageSystemReducer';
import {
    selectExperimentById,
    selectExperimentInclusionOverrideById,
} from '../messageSystemSelectors';
import {
    ExperimentId,
    type MessageSystemRootState,
    type MessageSystemState,
} from '../messageSystemTypes';

const buildState = (overrides: Partial<MessageSystemState> = {}): MessageSystemRootState => ({
    messageSystem: {
        ...messageSystemInitialState,
        ...overrides,
    },
});

const stateWithExperiment = buildState({
    config: {
        version: 1,
        timestamp: '2023-01-01',
        sequence: 1,
        actions: [],
        experiments: [
            {
                experiment: {
                    id: ExperimentId.tradingFeedbackForm,
                    groups: [
                        { variant: 'A', percentage: 50 },
                        { variant: 'B', percentage: 50 },
                    ],
                },
            },
        ],
    },
    validExperiments: [ExperimentId.tradingFeedbackForm],
} as unknown as Partial<MessageSystemState>);

describe('selectExperimentById', () => {
    it('returns the matching experiment when present', () => {
        const result = selectExperimentById(stateWithExperiment, ExperimentId.tradingFeedbackForm);
        expect(result?.id).toBe(ExperimentId.tradingFeedbackForm);
    });

    it('returns undefined when no experiment matches', () => {
        const result = selectExperimentById(stateWithExperiment, ExperimentId.tradingFiatValues);
        expect(result).toBeUndefined();
    });

    it('returns the same reference across repeated calls on unchanged state (memoization)', () => {
        const a = selectExperimentById(stateWithExperiment, ExperimentId.tradingFeedbackForm);
        const b = selectExperimentById(stateWithExperiment, ExperimentId.tradingFeedbackForm);
        expect(a).toBe(b);
    });
});

describe('selectExperimentInclusionOverrideById', () => {
    const stateWithOverride = buildState({
        experimentInclusionOverrides: {
            [ExperimentId.tradingFeedbackForm]: true,
        },
    } as unknown as Partial<MessageSystemState>);

    it('returns the matching override value when present', () => {
        expect(
            selectExperimentInclusionOverrideById(
                stateWithOverride,
                ExperimentId.tradingFeedbackForm,
            ),
        ).toBe(true);
    });

    it('returns null when no override is set for that id', () => {
        expect(
            selectExperimentInclusionOverrideById(
                stateWithOverride,
                ExperimentId.tradingFiatValues,
            ),
        ).toBeNull();
    });

    it('returns the same primitive across repeated calls on unchanged state (memoization)', () => {
        const a = selectExperimentInclusionOverrideById(
            stateWithOverride,
            ExperimentId.tradingFeedbackForm,
        );
        const b = selectExperimentInclusionOverrideById(
            stateWithOverride,
            ExperimentId.tradingFeedbackForm,
        );
        expect(a).toBe(b);
    });
});
