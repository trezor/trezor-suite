import { type ComponentProps, type ComponentType, type ReactNode } from 'react';
import { Text } from 'react-native';
import { FadeIn, FadeOut, LinearTransition, useReducedMotion } from 'react-native-reanimated';

import { renderWithBasicProvider } from '@suite-native/test-utils';

import { AnimatedBox } from './AnimatedBox';
import { AnimatedPressable } from './AnimatedPressable';
import { AnimatedScrollView } from './AnimatedScrollView';
import { AnimatedHStack, AnimatedVStack } from './AnimatedStack';
import { AnimatedText } from './AnimatedText';
import { AnimatedView } from './AnimatedView';

jest.mock('react-native-reanimated', () => ({
    ...jest.requireActual('react-native-reanimated/mock'),
    useReducedMotion: jest.fn(),
}));

type TestAnimatedAtomProps = Pick<
    ComponentProps<typeof AnimatedView>,
    'entering' | 'exiting' | 'layout' | 'testID' | 'accessibilityLabel'
> & {
    children: ReactNode;
    style: { opacity: number };
};

const animatedAtoms: [string, ComponentType<TestAnimatedAtomProps>][] = [
    ['AnimatedView', AnimatedView],
    ['AnimatedScrollView', AnimatedScrollView],
    ['AnimatedBox', AnimatedBox],
    ['AnimatedText', AnimatedText],
    ['AnimatedPressable', AnimatedPressable],
    ['AnimatedHStack', AnimatedHStack],
    ['AnimatedVStack', AnimatedVStack],
];

describe.each(animatedAtoms)('%s', (_name, Component) => {
    it.each([false, true])(
        'respects reduced motion = %s and preserves content and styles',
        async isReducedMotion => {
            jest.mocked(useReducedMotion).mockReturnValue(isReducedMotion);

            const { getByTestId, getByText } = await renderWithBasicProvider(
                <Component
                    testID="animated-atom"
                    entering={FadeIn}
                    exiting={FadeOut}
                    layout={LinearTransition}
                    style={{ opacity: 0.7 }}
                    accessibilityLabel="Animated content"
                >
                    <Text>Content</Text>
                </Component>,
            );

            const element = getByTestId('animated-atom');
            expect(element.props.entering).toBe(isReducedMotion ? undefined : FadeIn);
            expect(element.props.exiting).toBe(isReducedMotion ? undefined : FadeOut);
            expect(element.props.layout).toBe(isReducedMotion ? undefined : LinearTransition);
            expect(element).toHaveStyle({ opacity: 0.7 });
            expect(element.props.accessibilityLabel).toBe('Animated content');
            expect(getByText('Content')).toBeTruthy();
        },
    );
});
