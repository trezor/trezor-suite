import { type ReactNode } from 'react';

import { Column } from '@trezor/components';
import { DataAnalytics } from '@trezor/product-components';
import { DATA_TOS_URL, DOCS_ANALYTICS_URL } from '@trezor/urls';

import { TrezorLink } from 'src/components/suite/TrezorLink';
import { useAnalytics } from 'src/support/useAnalytics';

import { WelcomeLayoutWithoutModalSwitcher } from '../../components/suite/layouts/WelcomeLayout/WelcomeLayoutWithoutModalSwitcher';

export const AnalyticsConsentScreen = () => {
    const analytics = useAnalytics();

    const onConfirm = (trackingEnabled: boolean) => {
        if (trackingEnabled) {
            analytics.enable();
        } else {
            analytics.disable();
        }
    };

    return (
        <WelcomeLayoutWithoutModalSwitcher showPureChildren={true} hideSidebar={true}>
            <Column width="100%" alignItems="center">
                <DataAnalytics
                    onConfirm={onConfirm}
                    analyticsLink={(chunks: ReactNode[]) => (
                        <TrezorLink href={DOCS_ANALYTICS_URL}>{chunks}</TrezorLink>
                    )}
                    tosLink={(chunks: ReactNode[]) => (
                        <TrezorLink href={DATA_TOS_URL}>{chunks}</TrezorLink>
                    )}
                />
            </Column>
        </WelcomeLayoutWithoutModalSwitcher>
    );
};
