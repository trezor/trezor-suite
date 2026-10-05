import { type Ref, createRef } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

import { type AnimationObject, type LottieViewProps } from 'lottie-react-native';

import { act, renderWithBasicProvider } from '@suite-native/test-utils';

import { LottieView, type LottieViewRef } from './LottieView';
import { LottieAnimation } from '../LottieAnimation';

const mockPlay = jest.fn();
const mockPause = jest.fn();
const mockResume = jest.fn();
const mockReset = jest.fn();

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
                pause: mockPause,
                resume: mockResume,
                reset: mockReset,
            }));

            return <View {...props} testID={props.testID ?? 'lottie-view'} />;
        }),
    };
});

const source: AnimationObject = {
    v: '5.9.6',
    fr: 60,
    ip: 0,
    op: 120,
    w: 100,
    h: 100,
    assets: [],
    layers: [],
};

describe('LottieView', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(useReducedMotion).mockReturnValue(false);
    });

    it.each([false, true])('respects reduced motion = %s', async isReducedMotion => {
        jest.mocked(useReducedMotion).mockReturnValue(isReducedMotion);
        const onAnimationFinish = jest.fn();
        const { getByTestId } = await renderWithBasicProvider(
            <LottieView
                source={source}
                autoPlay
                loop
                progress={0.25}
                speed={1.5}
                duration={2000}
                onAnimationFinish={onAnimationFinish}
                style={{ width: 100, height: 100 }}
            />,
        );

        const view = getByTestId('lottie-view');
        expect(view.props.autoPlay).toBe(!isReducedMotion);
        expect(view.props.loop).toBe(!isReducedMotion);
        expect(view.props.progress).toBe(isReducedMotion ? 0.5 : 0.25);
        expect(view.props.speed).toBe(isReducedMotion ? 0 : 1.5);
        expect(view.props.duration).toBe(isReducedMotion ? undefined : 2000);
        expect(view.props.onAnimationFinish).toBe(isReducedMotion ? undefined : onAnimationFinish);
        expect(view.props.source).toBe(source);
        expect(view).toHaveStyle({ width: 100, height: 100 });
    });

    it('preserves the imperative playback API when motion is enabled', async () => {
        const ref = createRef<LottieViewRef>();
        await renderWithBasicProvider(<LottieView ref={ref} source={source} />);

        await act(() => {
            ref.current?.play(0, 100);
            ref.current?.pause();
            ref.current?.resume();
            ref.current?.reset();
        });

        expect(mockPlay).toHaveBeenCalledWith(0, 100);
        expect(mockPause).toHaveBeenCalledTimes(1);
        expect(mockResume).toHaveBeenCalledTimes(1);
        expect(mockReset).toHaveBeenCalledTimes(1);
    });

    it('blocks imperative playback and animated progress under reduced motion', async () => {
        jest.mocked(useReducedMotion).mockReturnValue(true);
        const ref = createRef<LottieViewRef>();
        const { getByTestId, rerender } = await renderWithBasicProvider(
            <LottieView ref={ref} source={source} progress={0} reducedMotionProgress={0.75} />,
        );

        await act(() => {
            ref.current?.play();
            ref.current?.resume();
            ref.current?.reset();
        });
        await rerender(
            <LottieView ref={ref} source={source} progress={1} reducedMotionProgress={0.75} />,
        );

        expect(mockPlay).not.toHaveBeenCalled();
        expect(mockResume).not.toHaveBeenCalled();
        expect(mockReset).not.toHaveBeenCalled();
        expect(getByTestId('lottie-view').props.progress).toBe(0.75);
    });

    it('pauses existing playback when reduced motion becomes enabled', async () => {
        const ref = createRef<LottieViewRef>();
        const { rerender } = await renderWithBasicProvider(
            <LottieView ref={ref} source={source} />,
        );
        await act(() => ref.current?.play());
        jest.mocked(useReducedMotion).mockReturnValue(true);

        await rerender(<LottieView ref={ref} source={source} />);
        await act(() => ref.current?.play());

        expect(mockPause).toHaveBeenCalledTimes(1);
        expect(mockPlay).toHaveBeenCalledTimes(1);
    });

    it.each([false, true])(
        'applies globally to illustrations (reduced motion = %s)',
        async value => {
            jest.mocked(useReducedMotion).mockReturnValue(value);
            const { getByTestId } = await renderWithBasicProvider(
                <LottieAnimation source={source} />,
            );

            expect(getByTestId('lottie-view').props.autoPlay).toBe(!value);
            expect(getByTestId('lottie-view').props.loop).toBe(!value);
            expect(getByTestId('lottie-view')).toHaveStyle({ width: 224, height: 224 });
        },
    );
});
