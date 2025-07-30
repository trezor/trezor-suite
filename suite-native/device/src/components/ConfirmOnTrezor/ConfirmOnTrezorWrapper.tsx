import { PropsWithChildren, useEffect } from 'react';

import { AnimatedBox, Box, VStack, useBannerAwareSafeAreaInsets } from '@suite-native/atoms';
import { isDetoxTestBuild } from '@suite-native/config';
import { ScreenHeaderProps } from '@suite-native/navigation';
import { DynamicHeaderProvider } from '@suite-native/navigation/src/components/DynamicHeader/DynamicScreenHeaderContext';
import { useActiveColorScheme } from '@suite-native/theme';
import {
    StylesProvider,
    createRenderer,
    prepareNativeStyle,
    useNativeStyles,
} from '@trezor/styles';
import { prepareNativeTheme } from '@trezor/theme';

import { ConfirmOnTrezorContent } from './ConfirmOnTrezorContent';
import { ConfirmOnTrezorHeader } from './ConfirmOnTrezorHeader';
import { ConfirmOnTrezorInstructions } from './ConfirmOnTrezorInstructions';
import { BottomSheetControlProps, useConfirmOnTrezorSheet } from './hooks/useConfirmOnTrezorSheet';

export type ConfirmOnTrezorWrapperProps = PropsWithChildren<{
    controlRef?: React.Ref<BottomSheetControlProps>;
    isManualControlEnabled?: boolean;
    defaultHeader?: React.ReactNode;
}> &
    ScreenHeaderProps;

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
        triggerTransition,
        toggleSheet,
        panGesture,
        handleContainerLayout,
        handleHeaderLayout,
        translateY,
        headerHeight,
        snapPoints,
        isFullscreen,
        containerHeight,
    } = useConfirmOnTrezorSheet({
        controlRef,
    });
    const insets = useBannerAwareSafeAreaInsets();

    useEffect(() => {
        if (!headerHeight || !containerHeight || isManualControlEnabled) return;

        const timer = setTimeout(() => {
            triggerTransition();
        }, REVEAL_TIMEOUT);

        return () => clearTimeout(timer);
    }, [containerHeight, headerHeight, isManualControlEnabled, triggerTransition]);

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
                        snapPoints={snapPoints}
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
