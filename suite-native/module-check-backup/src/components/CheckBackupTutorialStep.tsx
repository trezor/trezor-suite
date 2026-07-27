import { Box } from '@suite-native/atoms';
import {
    SwipeableWalkthroughStep,
    SwipeableWalkthroughStepHeader,
    type SwipeableWalkthroughStepProps,
} from '@suite-native/swipeable-walkthrough';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

export type WalletBackupTutorialStepProps = Omit<
    SwipeableWalkthroughStepProps,
    'totalSteps' | 'children'
>;

const CHECK_BACKUP_TUTORIAL_STEPS_COUNT = 2;

const innerContainerStyle = prepareNativeStyle(utils => ({
    bottom: utils.spacings.sp16,
}));

export const CheckBackupTutorialStep = ({
    currentStepIndex,
    callout,
    title,
    description,
    ...swipeableWalkthroughStepProps
}: WalletBackupTutorialStepProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <SwipeableWalkthroughStep
            {...swipeableWalkthroughStepProps}
            currentStepIndex={currentStepIndex}
            totalSteps={CHECK_BACKUP_TUTORIAL_STEPS_COUNT}
        >
            <Box
                flex={1}
                justifyContent="center"
                alignItems="center"
                style={applyStyle(innerContainerStyle)}
            >
                <SwipeableWalkthroughStepHeader
                    callout={callout}
                    title={title}
                    description={description}
                />
            </Box>
        </SwipeableWalkthroughStep>
    );
};
