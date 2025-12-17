import { ReactNode } from 'react';

import { analytics } from '@suite-common/analytics';
import { Column } from '@trezor/components';
import styled, { useTheme } from 'styled-components';

import { DataAnalytics } from '@trezor/product-components';
import { DATA_TOS_URL, DOCS_ANALYTICS_URL } from '@trezor/urls';

import { TrezorLink } from 'src/components/suite/TrezorLink';
import { useLegacyAnalytics } from 'src/support/useAnalytics';

import { WelcomeLayoutWithoutModalSwitcher } from '../../components/suite/layouts/WelcomeLayout/WelcomeLayoutWithoutModalSwitcher';

export const AnalyticsConsentScreen = () => {
    const theme = useTheme();
    const legacyAnalytics = useLegacyAnalytics();

    const onConfirm = (trackingEnabled: boolean) => {
        if (trackingEnabled) {
            legacyAnalytics.enable();
        } else {
            legacyAnalytics.disable();
        }
    };

    return (
        <WelcomeLayoutWithoutModalSwitcher showPureChildren={true} hideSidebar={true}>
            <Column width="100%">
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
