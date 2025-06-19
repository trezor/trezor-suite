import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { AccountDetailsCard } from '@suite-native/accounts';
import { Box, Button, HStack } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import {
    Screen,
    ScreenFooterGradient,
    SendStackParamList,
    SendStackRoutes,
    StackProps,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { AccountBalanceScreenHeader } from '../components/AccountBalanceScreenHeader';
import { SendOutputFields } from '../components/SendOutputFields';
import { SwitchCoinControlButton } from '../components/SwitchCoinControlButton';
import { useSendForm } from '../hooks/useSendForm';

const screenFooterStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.sp16,
    paddingBottom: utils.spacings.sp16,
    backgroundColor: utils.colors.backgroundSurfaceElevation0,
}));

const Footer = ({
    isSubmitting,
    handleNavigateToReviewScreen,
}: {
    isSubmitting: boolean;
    handleNavigateToReviewScreen: () => void;
}) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Animated.View entering={SlideInDown} exiting={SlideOutDown}>
            <ScreenFooterGradient />
            <Box style={applyStyle(screenFooterStyle)}>
                <Button
                    accessibilityRole="button"
                    accessibilityLabel="validate send form"
                    testID="@send/form-submit-button"
                    onPress={handleNavigateToReviewScreen}
                    isDisabled={isSubmitting}
                >
                    <Translation id="generic.buttons.continue" />
                </Button>
            </Box>
        </Animated.View>
    );
};

export const SendOutputsScreen = ({
    route: { params },
}: StackProps<SendStackParamList, SendStackRoutes.SendOutputs>) => {
    const { accountKey, tokenContract } = params;
    const sendForm = useSendForm(accountKey, tokenContract);

    if (!sendForm) {
        return null;
    }
    const { form, isValid, isSubmitting, handleNavigateToReviewScreen } = sendForm;

    return (
        <Screen
            header={
                <AccountBalanceScreenHeader accountKey={accountKey} tokenContract={tokenContract} />
            }
            footer={
                isValid && (
                    <Footer
                        isSubmitting={isSubmitting}
                        handleNavigateToReviewScreen={handleNavigateToReviewScreen}
                    />
                )
            }
            focusedInputBottomOffset={148} // space below the main amount input + button height with vertical margin
        >
            <>
                <AccountDetailsCard accountKey={accountKey} tokenContract={tokenContract} />
                <Box marginTop="sp32">
                    <Form form={form}>
                        <SendOutputFields accountKey={accountKey} />
                        <HStack justifyContent="center" marginTop="sp24">
                            <SwitchCoinControlButton accountKey={accountKey} />
                        </HStack>
                    </Form>
                </Box>
            </>
        </Screen>
    );
};
