import { createMessageSystemState } from './__fixtures__/createMessageSystemState';
import {
    selectAllConfigExperiments,
    selectAllValidConfigExperiments,
    selectIsExperimentValid,
} from './messageSystemSelectors';
import { ExperimentId, type MessageSystemRootState } from './messageSystemTypes';

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
