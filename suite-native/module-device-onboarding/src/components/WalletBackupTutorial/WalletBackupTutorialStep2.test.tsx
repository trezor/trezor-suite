import { type PropsWithChildren } from 'react';
import { View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { act, render, renderHook } from '@suite-native/test-utils-store';

import { WalletBackupTutorialStep2 } from './WalletBackupTutorialStep2';

type PreparedReaction = {
    prepare: () => boolean;
    react: (isActive: boolean, previousIsActive: boolean | null) => void;
};

const preparedReactions: PreparedReaction[] = [];
let mockIsFocused = true;

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useIsFocused: () => mockIsFocused,
}));

// Reanimated's Jest mock does not run reactions when a shared value changes.
jest.mock('react-native-reanimated', () => ({
    ...jest.requireActual('react-native-reanimated/mock'),
    useAnimatedReaction: (
        prepare: PreparedReaction['prepare'],
        react: PreparedReaction['react'],
    ) => {
        preparedReactions.push({ prepare, react });
    },
}));

jest.mock('@suite-native/atoms', () => ({
    Box: ({ children }: PropsWithChildren) => <View>{children}</View>,
}));

jest.mock('@suite-native/intl', () => ({
    Translation: () => null,
}));

jest.mock('./WalletBackupTutorialStep', () => ({
    WalletBackupTutorialStep: ({ children }: PropsWithChildren) => <View>{children}</View>,
}));

jest.mock('../BackupRiskCardsAnimation', () => ({
    BackupRiskCardsAnimation: () => <View testID="backup-risk-cards-animation" />,
}));

const runLatestReaction = (previousIsActive: boolean | null) => {
    const reaction = preparedReactions.at(-1);
    reaction?.react(reaction.prepare(), previousIsActive);
};

describe('WalletBackupTutorialStep2', () => {
    beforeEach(() => {
        preparedReactions.length = 0;
        mockIsFocused = true;
    });

    it('mounts the animation only on step 2, including when returning to that step', async () => {
        const { result } = await renderHook(() => useSharedValue(0));
        const currentStepIndex = result.current;
        const { queryByTestId } = await render(
            <WalletBackupTutorialStep2 currentStepIndex={currentStepIndex} />,
        );

        await act(() => runLatestReaction(null));
        expect(queryByTestId('backup-risk-cards-animation')).toBeNull();

        await act(() => {
            currentStepIndex.set(1);
            runLatestReaction(false);
        });
        expect(queryByTestId('backup-risk-cards-animation')).not.toBeNull();

        await act(() => {
            currentStepIndex.set(2);
            runLatestReaction(true);
        });
        expect(queryByTestId('backup-risk-cards-animation')).toBeNull();

        await act(() => {
            currentStepIndex.set(1);
            runLatestReaction(false);
        });
        expect(queryByTestId('backup-risk-cards-animation')).not.toBeNull();
    });

    it('unmounts the animation when the tutorial loses focus and restores it on return', async () => {
        const { result } = await renderHook(() => useSharedValue(1));
        const currentStepIndex = result.current;
        const { queryByTestId, rerender } = await render(
            <WalletBackupTutorialStep2 currentStepIndex={currentStepIndex} />,
        );

        await act(() => runLatestReaction(null));
        expect(queryByTestId('backup-risk-cards-animation')).not.toBeNull();

        mockIsFocused = false;
        await rerender(<WalletBackupTutorialStep2 currentStepIndex={currentStepIndex} />);
        expect(queryByTestId('backup-risk-cards-animation')).toBeNull();

        mockIsFocused = true;
        await rerender(<WalletBackupTutorialStep2 currentStepIndex={currentStepIndex} />);
        expect(queryByTestId('backup-risk-cards-animation')).not.toBeNull();
    });
});
