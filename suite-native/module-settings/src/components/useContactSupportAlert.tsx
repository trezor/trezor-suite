import { useCallback, useRef } from 'react';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { useAlert } from '@suite-native/alerts';
import { selectNativeAnalyticsDep } from '@suite-native/analytics';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';

import {
    ContactSupportAlertAppendix,
    type ContactSupportAlertAppendixRef,
} from './ContactSupportAlertAppendix';

export const useContactSupportAlert = () => {
    const appendixRef = useRef<ContactSupportAlertAppendixRef>(null);
    const { showAlert } = useAlert();
    const openLink = useOpenLink();
    const { analytics } = useServices(selectNativeAnalyticsDep);

    const showContactSupportAlert = useCallback(() => {
        showAlert({
            title: <Translation id="moduleSettings.faq.needHelp.contactSupportAlert.title" />,
            textAlign: 'left',
            appendix: <ContactSupportAlertAppendix ref={appendixRef} />,
            primaryButtonTitle: (
                <Translation id="moduleSettings.faq.needHelp.contactSupportAlert.primaryButton" />
            ),
            primaryButtonIconRight: 'arrowLineUpRight',
            onPressPrimaryButton: async () => {
                if (appendixRef.current) {
                    // We need to access the URL via a ref to ensure it's always up to date, even if the value changes while the alert is already displayed.
                    analytics.report({
                        type: events.guideSupportChatOpenedEvent.name,
                        payload: {
                            systemInfoShared: appendixRef.current.getIsSystemInfoShared(),
                            platform: 'mobile',
                        },
                    });
                    await openLink(appendixRef.current.getSupportChatUrl());
                }
            },
            secondaryButtonTitle: <Translation id="generic.buttons.cancel" />,
            testID: '@contact-support-alert',
        });
    }, [showAlert, openLink, analytics]);

    return { showContactSupportAlert };
};
