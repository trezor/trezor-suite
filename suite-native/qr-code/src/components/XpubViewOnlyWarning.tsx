import { Button, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type XpubViewOnlyWarningProps = {
    onContinue: () => void;
    onBack: () => void;
};

const buttonWrapperStyle = prepareNativeStyle(() => ({
    width: '100%',
}));

export const XpubViewOnlyWarning = ({ onContinue, onBack }: XpubViewOnlyWarningProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <VStack spacing="sp24">
            <VStack alignItems="center">
                <Text variant="headline-sm">
                    <Translation id="moduleAccountManagement.accountSettingsScreen.xpubBottomSheet.viewOnlyWarning.title" />
                </Text>
                <Text color="contentSecondary">
                    <Translation id="moduleAccountManagement.accountSettingsScreen.xpubBottomSheet.viewOnlyWarning.description" />
                </Text>
            </VStack>
            <VStack spacing="sp16" style={applyStyle(buttonWrapperStyle)}>
                <Button intent="warning" priority="primary" onPress={onContinue}>
                    <Translation id="moduleAccountManagement.accountSettingsScreen.xpubBottomSheet.viewOnlyWarning.primaryButton" />
                </Button>
                <Button intent="warning" priority="secondary" onPress={onBack}>
                    <Translation id="moduleAccountManagement.accountSettingsScreen.xpubBottomSheet.viewOnlyWarning.secondaryButton" />
                </Button>
            </VStack>
        </VStack>
    );
};
