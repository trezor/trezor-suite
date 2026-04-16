import { useEffect } from 'react';

import { AnimatedBox, Box, VStack, useBannerAwareSafeAreaInsets } from '@suite-native/atoms';
import { isDetoxTestBuild } from '@suite-native/config';
import { DynamicHeaderProvider } from '@suite-native/navigation';
import { useActiveColorScheme } from '@suite-native/theme';
import {
    StylesProvider,
    createRenderer,
    prepareNativeStyle,
    useNativeStyles,
} from '@trezor/styles-native';
import { prepareNativeTheme } from '@trezor/theme';

import { ConfirmOnTrezorContent, type ConfirmOnTrezorWrapperProps } from './ConfirmOnTrezorContent';
import { ConfirmOnTrezorHeader } from './ConfirmOnTrezorHeader';
import { ConfirmOnTrezorInstructions } from './ConfirmOnTrezorInstructions';
import { useConfirmOnTrezorSheet } from '../hooks/useConfirmOnTrezorSheet';

const instructionsContainerStyle = prepareNativeStyle<{
    paddingTop: number;
}>((utils, { paddingTop }) => ({
    paddingTop,
    backgroundColor: utils.colors.backgroundSurfaceElevation0,
}));

const REVEAL_TIMEOUT = isDetoxTestBuild() ? 0 : 1500;

const renderer = createRenderer();

const ConfirmOnTrezor = ({
    children,
    controlRef,
    isManualControlEnabled = false,
    defaultHeader,
    ...headerProps
}: ConfirmOnTrezorWrapperProps) => {
    const { applyStyle } = useNativeStyles();
    const colorVariant = useActiveColorScheme();
    const theme = prepareNativeTheme({ colorVariant });

    const {
        revealConfirmOnTrezorSheet,
        toggleSheet,
        panGesture,
        handleContainerLayout,
        handleHeaderLayout,
        translateY,
        headerHeight,
        snapPoints,
        isFullscreen,
        containerHeight,
        initialSnapIndex,
    } = useConfirmOnTrezorSheet({
        controlRef,
    });
    const insets = useBannerAwareSafeAreaInsets();

    useEffect(() => {
        if (!headerHeight || !containerHeight || isManualControlEnabled || initialSnapIndex) return;

        const timer = setTimeout(() => {
            revealConfirmOnTrezorSheet();
        }, REVEAL_TIMEOUT);

        return () => clearTimeout(timer);
    }, [
        containerHeight,
        headerHeight,
        initialSnapIndex,
        isManualControlEnabled,
        revealConfirmOnTrezorSheet,
    ]);

    return (
        <DynamicHeaderProvider>
            <AnimatedBox flex={1} onLayout={handleContainerLayout}>
                <VStack
                    flex={1}
                    style={applyStyle(instructionsContainerStyle, {
                        paddingTop: insets.top,
                    })}
                >
                    <Box onLayout={handleHeaderLayout}>
                        <ConfirmOnTrezorHeader onToggleSheet={toggleSheet} {...headerProps} />
                    </Box>
                    <ConfirmOnTrezorInstructions />
                </VStack>
                <StylesProvider renderer={renderer} theme={theme}>
                    <ConfirmOnTrezorContent
                        panGesture={panGesture}
                        translateY={translateY}
                        snapPoints={snapPoints as [number, number, number]}
                        isFullscreen={isFullscreen}
                        defaultHeader={defaultHeader}
                    >
                        {children}
                    </ConfirmOnTrezorContent>
                </StylesProvider>
            </AnimatedBox>
        </DynamicHeaderProvider>
    );
};

export const ConfirmOnTrezorWrapper = (props: ConfirmOnTrezorWrapperProps) => {
    const theme = prepareNativeTheme({ colorVariant: 'dark' });

    return (
        <StylesProvider theme={theme} renderer={renderer}>
            <ConfirmOnTrezor {...props} />
        </StylesProvider>
    );
};
