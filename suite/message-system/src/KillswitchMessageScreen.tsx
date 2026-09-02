import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useExternalLink } from '@suite/external-links';
import { Translation } from '@suite/intl';
import { type Route, gotoThunk } from '@suite/router';
import { selectLanguage } from '@suite/settings';
import { useServices } from '@suite-common/dependency-injection';
import {
    messageSystemActions,
    resolveMessageContent,
    selectActiveKillswitchMessage,
} from '@suite-common/message-system';
import { useDispatch } from '@suite-common/redux-utils';
import { selectReloadAppDep } from '@suite-common/suite-types';
import { Column, H2, Modal, Paragraph } from '@trezor/components';
import TrezorConnect from '@trezor/connect';

const APP_RESTART_DELAY_MILLISECONDS = 100;

type CtaButtonProps = {
    ctaLabel: string;
    ctaLink: string;
    isExternalCta: boolean;
};

export const CtaButton = ({ ctaLabel, ctaLink, isExternalCta }: CtaButtonProps) => {
    const dispatch = useDispatch();
    const externalLink = useExternalLink(ctaLink);

    const handleClick = () => {
        if (isExternalCta) {
            window.open(externalLink, '_blank');
        } else {
            dispatch(gotoThunk({ routeName: ctaLink as Route['name'], preserveParams: true }));
        }
    };

    return (
        <Modal.Button onClick={handleClick} size="large">
            {ctaLabel}
        </Modal.Button>
    );
};

export const KillswitchMessageScreen = () => {
    const dispatch = useDispatch();
    const language = useSelector(selectLanguage);
    const activeKillswitchMessage = useSelector(selectActiveKillswitchMessage);
    const { reloadApp } = useServices(selectReloadAppDep);

    // Destroy Connect instance, to prevent any device or backend interaction on the background
    // Connect won't init if there is an active killswitch (see appInitThunks), but message system can be updated anytime later.
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

    const isCtaVisible = ctaLabel && ctaLink;

    const handleDismiss = () => {
        if (!isDismissible) return;
        dispatch(messageSystemActions.dismissMessage({ id: messageId, category: 'feature' }));

        // To reinitialize Connect, we need to restart whole Desktop App / refresh Web window.
        // Leave some time for DB persistence.
        setTimeout(() => {
            reloadApp();
        }, APP_RESTART_DELAY_MILLISECONDS);
    };

    return (
        <Modal
            intent={variant}
            bottomContent={
                <>
                    {isCtaVisible && ctaLink && (
                        <CtaButton
                            ctaLabel={ctaLabel}
                            ctaLink={ctaLink}
                            isExternalCta={isExternalCta}
                        />
                    )}
                    {isDismissible && (
                        <Modal.Button
                            intent={variant}
                            priority="secondary"
                            onClick={handleDismiss}
                            size="large"
                        >
                            <Translation id="TR_DISMISS" />
                        </Modal.Button>
                    )}
                </>
            }
        >
            <Column gap={12}>
                <H2>{messageTitle ?? <Translation id="KILLSWITCH_SCREEN_DEFAULT_TITLE" />}</H2>
                <Paragraph intent={variant} priority="secondary">
                    {messageContent ?? <Translation id="KILLSWITCH_SCREEN_DEFAULT_CONTENT" />}
                </Paragraph>
            </Column>
        </Modal>
    );
};
