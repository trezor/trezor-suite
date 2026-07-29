import { type ReactNode } from 'react';

import { selectDesktopAnalyticsDep } from '@suite/analytics';
import { TrezorLink } from '@suite/external-links';
import { useServices } from '@suite-common/dependency-injection';
import { Column } from '@trezor/components';
import { DataAnalytics } from '@trezor/product-components';
import { DATA_TOS_URL } from '@trezor/urls';

import { WelcomeLayoutWithoutModalSwitcher } from '../../components/suite/layouts/WelcomeLayout/WelcomeLayoutWithoutModalSwitcher';

export const AnalyticsConsentScreen = () => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);

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
                    tosLink={(chunks: ReactNode[]) => (
                        <TrezorLink href={DATA_TOS_URL}>{chunks}</TrezorLink>
                    )}
                />
            </Column>
        </WelcomeLayoutWithoutModalSwitcher>
    );
};
