import { type ReactNode } from 'react';
import { FadeIn, FadeOut, FadingTransition } from 'react-native-reanimated';

import {
    AnimatedText,
    AnimatedVStack,
    Spinner,
    type SpinnerLoadingState,
    VStack,
} from '@suite-native/atoms';

export type WaitingCardProps = {
    title: ReactNode;
    subtitle: ReactNode;
    loadingState?: SpinnerLoadingState;
    children?: ReactNode;
    testID?: string;
};

export const WaitingCard = ({
    title,
    subtitle,
    loadingState = 'idle',
    testID,
    children,
}: WaitingCardProps) => (
    <AnimatedVStack
        entering={FadeIn}
        exiting={FadeOut}
        alignItems="center"
        paddingTop="sp16"
        spacing="sp16"
        testID={testID}
    >
        <Spinner loadingState={loadingState} />
        <VStack alignItems="center" spacing="sp4">
            <AnimatedText
                variant="headline-sm"
                color="contentPrimary"
                textAlign="center"
                layout={FadingTransition}
            >
                {title}
            </AnimatedText>
            <AnimatedText variant="body-sm" color="contentPrimary" textAlign="center">
                {subtitle}
            </AnimatedText>
        </VStack>
        {children}
    </AnimatedVStack>
);
