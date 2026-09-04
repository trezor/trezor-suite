import { act, renderHookWithBasicProvider } from '@suite-native/test-utils';

import { useBottomSheetInteractionGate } from './useBottomSheetInteractionGate';

type PreparedReaction = {
    prepare: () => boolean;
    react: (isSettled: boolean, previousIsSettled: boolean | null) => void;
};

const preparedReactions: PreparedReaction[] = [];

// The reanimated jest mock turns `useAnimatedReaction` into a no-op, so the reaction is captured
// here instead and driven by hand from the assertions below.
jest.mock('react-native-reanimated', () => ({
    ...jest.requireActual('react-native-reanimated/mock'),
    useAnimatedReaction: (prepare: () => boolean, react: PreparedReaction['react']) => {
        preparedReactions.push({ prepare, react });
    },
}));

const runLatestReaction = (previousIsSettled: boolean | null) => {
    const latestReaction = preparedReactions.at(-1);

    if (!latestReaction) {
        throw new Error('No animated reaction has been prepared by the hook.');
    }

    latestReaction.react(latestReaction.prepare(), previousIsSettled);
};

describe('useBottomSheetInteractionGate', () => {
    beforeEach(() => {
        preparedReactions.length = 0;
    });

    it('reports a closed sheet as settled so that it does not block a sheet that never animates', async () => {
        const { result } = await renderHookWithBasicProvider(() => useBottomSheetInteractionGate());

        expect(result.current.animatedIndex.value).toBe(-1);
        expect(result.current.isSheetSettled).toBe(true);
    });

    it('is not settled while the sheet animates between the closed position and a snap point', async () => {
        const { result } = await renderHookWithBasicProvider(() => useBottomSheetInteractionGate());

        await act(() => {
            result.current.animatedIndex.value = -0.42;
            runLatestReaction(true);
        });

        expect(result.current.isSheetSettled).toBe(false);
    });

    it('is settled again once the sheet reaches a snap point', async () => {
        const { result } = await renderHookWithBasicProvider(() => useBottomSheetInteractionGate());

        await act(() => {
            result.current.animatedIndex.value = -0.42;
            runLatestReaction(true);
        });

        await act(() => {
            result.current.animatedIndex.value = 0;
            runLatestReaction(false);
        });

        expect(result.current.isSheetSettled).toBe(true);
    });
});
