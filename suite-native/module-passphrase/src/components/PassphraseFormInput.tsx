import { SecureTextInputField } from '@suite-native/forms';
import { formInputsMaxLength } from '@suite-common/validators';
import { Card, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { useScrollView } from '@suite-native/navigation';

const SCROLL_DELAY = 100;

type PassphraseFormProps = {
    onFocus?: () => void;
    onBlur?: () => void;
    inputLabel: string;
};

const formStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    borderRadius: utils.borders.radii.large,
    gap: utils.spacings.medium,
}));

const cardStyle = prepareNativeStyle(_ => ({
    padding: 12,
}));

export const PassphraseFormInput = ({ inputLabel, onFocus, onBlur }: PassphraseFormProps) => {
    const scrollView = useScrollView();

    const { applyStyle } = useNativeStyles();

    const handleScrollToBottom = () => {
        if (scrollView) {
            // Scroll down so the submit button slide-up animation does not hide the input.
            // The delay make the combination of scroll and button animation feel more natural together.
            setTimeout(() => scrollView.scrollToEnd({ animated: true }), SCROLL_DELAY);
        }
    };

    const handleFocus = () => {
        handleScrollToBottom();
        onFocus?.();
    };

    return (
        <Card style={applyStyle(cardStyle)}>
            <VStack style={applyStyle(formStyle)}>
                <SecureTextInputField
                    label={inputLabel}
                    name="passphrase"
                    maxLength={formInputsMaxLength.passphrase}
                    accessibilityLabel="passphrase input"
                    autoCapitalize="none"
                    onFocus={handleFocus}
                    onBlur={onBlur}
                    onChangeText={handleScrollToBottom}
                    secureTextEntry
                />
            </VStack>
        </Card>
    );
};
