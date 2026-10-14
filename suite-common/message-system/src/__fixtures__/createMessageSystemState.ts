import { messageSystemInitialState } from '../messageSystemReducer';
import { ExperimentId, type MessageSystemState } from '../messageSystemTypes';

export const experimentGroups = [
    { variant: 'A', percentage: 50 },
    { variant: 'B', percentage: 50 },
];

type CreateMessageSystemStateParams = {
    groups?: typeof experimentGroups;
    inclusionOverride?: number;
};

export const createMessageSystemState = ({
    groups = experimentGroups,
    inclusionOverride,
}: CreateMessageSystemStateParams = {}) =>
    ({
        ...messageSystemInitialState,
        config: {
            version: 1,
            timestamp: '2023-01-01',
            sequence: 1,
            actions: [],
            experiments: [
                {
                    conditions: [],
                    experiment: {
                        id: ExperimentId.tradingFeedbackForm,
                        groups,
                    },
                },
            ],
        },
        validExperiments: [ExperimentId.tradingFeedbackForm],
        experimentInclusionOverrides:
            inclusionOverride !== undefined
                ? { [ExperimentId.tradingFeedbackForm]: inclusionOverride }
                : undefined,
    }) as unknown as MessageSystemState;
