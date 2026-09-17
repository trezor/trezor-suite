import { combineReducers } from '@reduxjs/toolkit';

import { mockActionType } from '@suite-common/redux-utils/mocks';
import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { getIntegerInRangeFromString } from '@trezor/utils';

jest.mock('@trezor/utils', () => ({
    ...jest.requireActual('@trezor/utils'),
    getIntegerInRangeFromString: jest.fn((value: string, range: number) =>
        jest.requireActual('@trezor/utils').getIntegerInRangeFromString(value, range),
    ),
}));

import { createMessageSystemState } from './__fixtures__/createMessageSystemState';
import { messageSystemInitialState, prepareMessageSystemReducer } from './messageSystemReducer';
import { ExperimentId, type MessageSystemState } from './messageSystemTypes';
import { useExperiment } from './useExperiment';

const messageSystemReducer = prepareMessageSystemReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
});

const createRoot = (
    overrides: {
        messageSystem?: MessageSystemState;
        instanceId?: string | undefined;
    } = {},
) => {
    const messageSystem = overrides.messageSystem ?? createMessageSystemState();
    // distinguish an explicit `instanceId: undefined` from an absent key
    const instanceId = 'instanceId' in overrides ? overrides.instanceId : 'test-instance-id';

    return createTestCompositionRoot({
        reducer: combineReducers({
            messageSystem: messageSystemReducer,
            analytics: (state = { instanceId }) => state,
        }),
        preloadedState: { messageSystem } as { messageSystem: MessageSystemState },
    });
};

const renderUseExperiment = (root = createRoot()) =>
    renderHookWithStoreProvider(() => useExperiment(ExperimentId.tradingFeedbackForm), { root });

describe('useExperiment', () => {
    it('returns undefined experiment and variant when experiment is not valid', () => {
        const root = createRoot({ messageSystem: messageSystemInitialState });
        const { result } = renderUseExperiment(root);

        expect(result.current.experiment).toBeUndefined();
        expect(result.current.activeExperimentVariant).toBeUndefined();
    });

    it('returns undefined variant when instanceId is missing', () => {
        const root = createRoot({ instanceId: undefined });
        const { result } = renderUseExperiment(root);

        expect(result.current.experiment).toBeDefined();
        expect(result.current.activeExperimentVariant).toBeUndefined();
    });

    it('assigns the only group when it covers 100 %', () => {
        const root = createRoot({
            messageSystem: createMessageSystemState({
                groups: [{ variant: 'A', percentage: 100 }],
            }),
        });
        const { result } = renderUseExperiment(root);

        expect(result.current.activeExperimentVariant?.variant).toBe('A');
    });

    it.each([
        { inclusion: 0, expectedVariant: 'A' },
        { inclusion: 29, expectedVariant: 'A' },
        { inclusion: 30, expectedVariant: 'B' },
        { inclusion: 69, expectedVariant: 'B' },
        { inclusion: 70, expectedVariant: 'C' },
        { inclusion: 99, expectedVariant: 'C' },
    ])(
        'assigns variant $expectedVariant from instanceId when group assignment yields $inclusion',
        ({ inclusion, expectedVariant }) => {
            jest.mocked(getIntegerInRangeFromString).mockReturnValueOnce(inclusion);

            const root = createRoot({
                messageSystem: createMessageSystemState({
                    groups: [
                        { variant: 'A', percentage: 30 },
                        { variant: 'B', percentage: 40 },
                        { variant: 'C', percentage: 30 },
                    ],
                }),
            });
            const { result } = renderUseExperiment(root);

            expect(result.current.activeExperimentVariant?.variant).toBe(expectedVariant);
        },
    );

    it.each([
        { inclusionOverride: 0, expectedVariant: 'A' },
        { inclusionOverride: 49, expectedVariant: 'A' },
        { inclusionOverride: 50, expectedVariant: 'B' },
        { inclusionOverride: 99, expectedVariant: 'B' },
    ])(
        'assigns variant $expectedVariant for inclusion override $inclusionOverride',
        ({ inclusionOverride, expectedVariant }) => {
            const root = createRoot({
                messageSystem: createMessageSystemState({ inclusionOverride }),
            });
            const { result } = renderUseExperiment(root);

            expect(result.current.activeExperimentVariant?.variant).toBe(expectedVariant);
        },
    );
});
