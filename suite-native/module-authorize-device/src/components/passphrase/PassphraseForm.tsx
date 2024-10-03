import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { Form, SecureTextInputField, useForm } from '@suite-native/forms';
import {
    passphraseFormSchema,
    PassphraseFormValues,
    formInputsMaxLength,
} from '@suite-common/validators';
import { Button, Card, VStack, TextDivider } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Translation } from '@suite-native/intl';
import {
    onPassphraseSubmit,
    selectHasDevicePassphraseEntryCapability,
} from '@suite-common/wallet-core';
import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList,
    StackToStackCompositeNavigationProps,
    useScrollView,
} from '@suite-native/navigation';
import { EventType, analytics } from '@suite-native/analytics';

import { EnterPassphraseOnTrezorButton } from './EnterPassphraseOnTrezorButton';
import { NoPassphraseButton } from './NoPassphraseButton';

const FORM_CARD_PADDING = 12;

// iOS scroll needs to calculate also with the keyboard height.
const SCROLL_OFFSET = Platform.OS === 'android' ? 0 : 250;
const SCROLL_DELAY = 100;

type PassphraseFormProps = {
    onFocus?: () => void;
    inputLabel: string;
    noPassphraseEnabled?: boolean;
};

const formStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    borderRadius: utils.borders.radii.r24,
    gap: utils.spacings.sp16,
}));

const cardStyle = prepareNativeStyle(_ => ({
    padding: FORM_CARD_PADDING,
}));

type NavigationProp = StackToStackCompositeNavigationProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes.PassphraseForm,
    RootStackParamList
>;

export const PassphraseForm = ({
    inputLabel,
    onFocus,
    noPassphraseEnabled,
}: PassphraseFormProps) => {
    const dispatch = useDispatch();
    const scrollView = useScrollView();
    const formWrapperView = useRef<View>(null);

    const [isInputFocused, setIsInputFocused] = useState(false);

    const { applyStyle } = useNativeStyles();

    const navigation = useNavigation<NavigationProp>();

    const hasDevicePassphraseEntryCapability = useSelector(
        selectHasDevicePassphraseEntryCapability,
    );

    const form = useForm<PassphraseFormValues>({
        validation: passphraseFormSchema,
        reValidateMode: 'onSubmit',
        defaultValues: {
            passphrase: '',
        },
    });

    const {
        handleSubmit,
        formState: { isDirty },
        reset,
    } = form;

    const handleScrollToButton = useCallback(() => {
        if (scrollView && formWrapperView.current) {
            // Scroll so the whole form including submit button is visible.The delay is needed, because the scroll can not start before the button animation finishes.
            formWrapperView.current.measureLayout(scrollView.getInnerViewNode(), (_, y) => {
                setTimeout(
                    () => scrollView.scrollTo({ y: y - SCROLL_OFFSET, animated: true }),
                    SCROLL_DELAY,
                );
            });
        }
    }, [scrollView]);

    useEffect(() => {
        if (isDirty) {
            handleScrollToButton();
        }
    }, [isDirty, handleScrollToButton]);

    const handleCreateHiddenWallet = handleSubmit(({ passphrase }) => {
        dispatch(onPassphraseSubmit({ value: passphrase, passphraseOnDevice: false }));
        navigation.push(AuthorizeDeviceStackRoutes.PassphraseConfirmOnTrezor);
        // Reset values so when user comes back to this screen, it's clean (for example if try again is triggered later in the flow)
        reset();
    });

    const handleFocusInput = () => {
        analytics.report({ type: EventType.PassphraseEnterInApp });
        setIsInputFocused(true);
        onFocus?.();
    };

    return (
        <Form form={form}>
            <View ref={formWrapperView}>
                <Card style={applyStyle(cardStyle)}>
                    <VStack style={applyStyle(formStyle)}>
                        <SecureTextInputField
                            label={inputLabel}
                            name="passphrase"
                            maxLength={formInputsMaxLength.passphrase}
                            accessibilityLabel="passphrase input"
                            autoCapitalize="none"
                            onFocus={handleFocusInput}
                            onBlur={() => setIsInputFocused(false)}
                            secureTextEntry
                        />
                        {isDirty && (
                            <Animated.View entering={FadeIn} exiting={FadeOut}>
                                <Button
                                    accessibilityRole="button"
                                    accessibilityLabel="confirm passphrase"
                                    onPress={handleCreateHiddenWallet}
                                >
                                    <Translation id="modulePassphrase.form.enterWallet" />
                                </Button>
                            </Animated.View>
                        )}
                        {!isDirty && !isInputFocused && hasDevicePassphraseEntryCapability && (
                            <Animated.View entering={FadeIn} exiting={FadeOut}>
                                <VStack>
                                    <TextDivider
                                        title="generic.orSeparator"
                                        horizontalMargin={FORM_CARD_PADDING}
                                    />
                                    <EnterPassphraseOnTrezorButton />
                                    {noPassphraseEnabled && <NoPassphraseButton />}
                                </VStack>
                            </Animated.View>
                        )}
                    </VStack>
                </Card>
            </View>
        </Form>
    );
};
