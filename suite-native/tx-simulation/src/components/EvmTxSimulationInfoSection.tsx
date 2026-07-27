import { type ReactNode } from 'react';

import { AnimatedBox, Box, Divider, HStack, PressableOpacity, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';

import { useEvmTxSimulationExpandableSectionAnimation } from '../hooks/useEvmTxSimulationExpandableSectionAnimation';

type EvmTxSimulationInfoSectionProps = {
    children: ReactNode;
    isExpanded: boolean;
    onPress: () => void;
    title: ReactNode;
};

const expandableContentStyle = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
} as const;

export const EvmTxSimulationInfoSection = ({
    children,
    isExpanded,
    onPress,
    title,
}: EvmTxSimulationInfoSectionProps) => {
    const { animatedCaretStyle, animatedContentStyle, handleContentLayout } =
        useEvmTxSimulationExpandableSectionAnimation({ isExpanded });

    return (
        <>
            <Divider />
            <PressableOpacity onPress={onPress}>
                <HStack padding="sp16" justifyContent="space-between" alignItems="center">
                    <Text>{title}</Text>
                    <AnimatedBox style={animatedCaretStyle}>
                        <Icon name="caretDown" size="small" color="contentSecondary" />
                    </AnimatedBox>
                </HStack>
            </PressableOpacity>
            <AnimatedBox pointerEvents={isExpanded ? 'auto' : 'none'} style={animatedContentStyle}>
                <Box
                    onLayout={handleContentLayout}
                    style={expandableContentStyle}
                    collapsable={false}
                >
                    {children}
                </Box>
            </AnimatedBox>
        </>
    );
};
