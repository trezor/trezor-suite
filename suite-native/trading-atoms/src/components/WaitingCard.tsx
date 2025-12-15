import { ReactNode } from 'react';
import { FadeIn, FadeOut } from 'react-native-reanimated';

import { AnimatedVStack, Spinner, SpinnerLoadingState, Text, VStack } from '@suite-native/atoms';

export type WaitingCardProps = {
    title: ReactNode;
    subtitle: ReactNode;
    loadingState?: SpinnerLoadingState;
    children?: ReactNode;
};

export const WaitingCard = ({
    title,
    subtitle,
    loadingState = 'idle',
    children,
}: WaitingCardProps) => (
    <AnimatedVStack
        entering={FadeIn}
        exiting={FadeOut}
        alignItems="center"
        paddingVertical="sp16"
        spacing="sp16"
    >
        <Spinner loadingState={loadingState} />
        <VStack alignItems="center" spacing="sp4">
            <Text variant="titleSmall" color="textDefault" textAlign="center">
                {title}
            </Text>
            <Text variant="hint" color="textDefault" textAlign="center">
                {subtitle}
            </Text>
        </VStack>
        {children}
    </AnimatedVStack>
);
