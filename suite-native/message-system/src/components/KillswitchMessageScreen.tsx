import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import {
    messageSystemActions,
    resolveMessageContent,
    selectActiveKillswitchMessage,
} from '@suite-common/message-system';
import { selectReloadAppDep } from '@suite-common/suite-types';
import { Box, Button, PictogramTitleHeader, VStack } from '@suite-native/atoms';
import { Translation, selectSupportedLanguageLocale } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import TrezorConnect from '@trezor/connect';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const APP_RESTART_DELAY_MILLISECONDS = 100;

const screenStyle = prepareNativeStyle(utils => ({
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: utils.spacings.sp24,
    paddingTop: utils.spacings.sp64,
    paddingBottom: utils.spacings.sp32,
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: utils.colors.surfaceFillPage,
}));

const contentStyle = prepareNativeStyle(_ => ({
    flexGrow: 1,
    justifyContent: 'center',
}));

const buttonsWrapperStyle = prepareNativeStyle(_ => ({
    width: '100%',
}));

export const KillswitchMessageScreen = () => {
    const dispatch = useDispatch();
    const language = useSelector(selectSupportedLanguageLocale);
    const openLink = useOpenLink();
    const { applyStyle } = useNativeStyles();
    const { reloadApp } = useServices(selectReloadAppDep);

    const activeKillswitchMessage = useSelector(selectActiveKillswitchMessage);

    // Destroy Connect instance, to prevent any device or backend interaction on the background.
    // Connect won't init if there is an active killswitch (see initActions.init), but message system can be updated anytime later.
    useEffect(() => {
        if (activeKillswitchMessage) {
            TrezorConnect.dispose();
        }
    }, [activeKillswitchMessage]);

    if (!activeKillswitchMessage) return null;

    const {
        id: messageId,
        variant,
        headline,
        content,
        cta,
        dismissible: isDismissible,
    } = activeKillswitchMessage;

    const messageTitle = headline ? resolveMessageContent(headline, language) : null;
    const messageContent = resolveMessageContent(content, language);
    const ctaLabel = cta ? resolveMessageContent(cta.label, language) : null;
    const ctaLink = cta?.link;
    const isExternalCta = cta?.action === 'external-link';

    const handleCtaPress = () => {
        if (isExternalCta && ctaLink) {
            openLink(ctaLink);
        } else {
            // TODO: handle internal link once we introduce them
        }
    };

    const isCtaVisible = ctaLabel && ctaLink;

    const handleDismiss = () => {
        if (!isDismissible) return;
        dispatch(messageSystemActions.dismissMessage({ id: messageId, category: 'feature' }));

        // To reinitialize Connect, we need to restart the native app.
        // Leave some time for DB persistence.
        setTimeout(() => {
            reloadApp();
        }, APP_RESTART_DELAY_MILLISECONDS);
    };

    return (
        <Box style={applyStyle(screenStyle)}>
            <Box style={applyStyle(contentStyle)}>
                <PictogramTitleHeader
                    variant={variant}
                    title={messageTitle ?? <Translation id="messageSystem.killswitch.title" />}
                    subtitle={
                        messageContent ?? <Translation id="messageSystem.killswitch.content" />
                    }
                    titleVariant="headline-md"
                />
            </Box>
            <VStack spacing="sp16" style={applyStyle(buttonsWrapperStyle)}>
                {isCtaVisible && (
                    <Button intent="brand" priority="primary" onPress={handleCtaPress}>
                        {ctaLabel}
                    </Button>
                )}
                {isDismissible && (
                    <Button intent="neutral" priority="secondary" onPress={handleDismiss}>
                        <Translation id="generic.buttons.dismiss" />
                    </Button>
                )}
            </VStack>
        </Box>
    );
};
