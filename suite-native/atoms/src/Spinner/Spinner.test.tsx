import { type Ref } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

import { type AnimationObject, type LottieViewProps } from 'lottie-react-native';

import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { Spinner, type SpinnerLoadingState } from './Spinner';
import { type LottieViewRef } from '../Animated/LottieView';

const successAnimation: AnimationObject = require('./refresh-spinner-end-success.json');
const errorAnimation: AnimationObject = require('./refresh-spinner-end-warning.json');
const idleAnimation: AnimationObject = require('./refresh-spinner-middle.json');
const startAnimation: AnimationObject = require('./refresh-spinner-start.json');

const mockPlay = jest.fn();

jest.mock('react-native-reanimated', () => ({
    ...jest.requireActual('react-native-reanimated/mock'),
    useReducedMotion: jest.fn(),
}));

jest.mock('lottie-react-native', () => {
    const React = jest.requireActual('react');
    const { View } = jest.requireActual('react-native');

    return {
        __esModule: true,
        default: React.forwardRef(function MockLottieView(
            props: LottieViewProps,
            ref: Ref<LottieViewRef>,
        ) {
            React.useImperativeHandle(ref, () => ({
                play: mockPlay,
                pause: jest.fn(),
                resume: jest.fn(),
                reset: jest.fn(),
            }));

            return <View {...props} testID="lottie-view" />;
        }),
    };
});

describe('Spinner', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(useReducedMotion).mockReturnValue(true);
    });

    it('shows a static loading indicator without completing or playing', async () => {
        const onComplete = jest.fn();
        const { getByTestId } = await renderWithBasicProvider(
            <Spinner loadingState="idle" onComplete={onComplete} />,
        );

        const view = getByTestId('lottie-view');
        expect(view.props.source).toBe(idleAnimation);
        expect(view.props.progress).toBe(0.5);
        expect(view.props.autoPlay).toBe(false);
        expect(mockPlay).not.toHaveBeenCalled();
        expect(onComplete).not.toHaveBeenCalled();
    });

    it.each<[SpinnerLoadingState, AnimationObject]>([
        ['success', successAnimation],
        ['error', errorAnimation],
    ])('completes %s without waiting for an animation', async (loadingState, expectedSource) => {
        const onComplete = jest.fn();
        const { getByTestId, rerender } = await renderWithBasicProvider(
            <Spinner loadingState="idle" onComplete={onComplete} />,
        );

        await rerender(<Spinner loadingState={loadingState} onComplete={onComplete} />);

        expect(getByTestId('lottie-view').props.source).toBe(expectedSource);
        expect(getByTestId('lottie-view').props.progress).toBe(1);
        expect(onComplete).toHaveBeenCalledTimes(1);
        expect(mockPlay).not.toHaveBeenCalled();

        await rerender(<Spinner loadingState={loadingState} onComplete={() => onComplete()} />);
        expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('completes an initially successful state and can complete a subsequent loading cycle', async () => {
        const onComplete = jest.fn();
        const { rerender } = await renderWithBasicProvider(
            <Spinner loadingState="success" onComplete={onComplete} />,
        );
        expect(onComplete).toHaveBeenCalledTimes(1);

        await rerender(<Spinner loadingState="idle" onComplete={onComplete} />);
        expect(onComplete).toHaveBeenCalledTimes(1);

        await rerender(<Spinner loadingState="error" onComplete={onComplete} />);
        expect(onComplete).toHaveBeenCalledTimes(2);
    });

    it('shows the requested final frame under reduced motion', async () => {
        const { getByTestId } = await renderWithBasicProvider(
            <Spinner loadingState="success" endFrame={305} />,
        );
        const { source, progress } = getByTestId('lottie-view').props;

        expect(source.ip + progress * (source.op - source.ip)).toBeCloseTo(305);
    });

    it('preserves animated transitions and completion when motion is enabled', async () => {
        jest.mocked(useReducedMotion).mockReturnValue(false);
        const onComplete = jest.fn();
        const { getByTestId, rerender } = await renderWithBasicProvider(
            <Spinner loadingState="idle" onComplete={onComplete} endFrame={305} />,
        );

        expect(getByTestId('lottie-view').props.source).toBe(startAnimation);
        expect(mockPlay).toHaveBeenCalledWith(0, undefined);

        await fireEvent(getByTestId('lottie-view'), 'animationFinish', false);
        expect(getByTestId('lottie-view').props.source).toBe(idleAnimation);
        await rerender(<Spinner loadingState="success" onComplete={onComplete} endFrame={305} />);
        expect(onComplete).not.toHaveBeenCalled();

        await fireEvent(getByTestId('lottie-view'), 'animationFinish', false);
        expect(getByTestId('lottie-view').props.source).toBe(successAnimation);
        expect(mockPlay).toHaveBeenCalledWith(0, 305);
        await fireEvent(getByTestId('lottie-view'), 'animationFinish', false);
        expect(onComplete).toHaveBeenCalledTimes(1);
    });
});
