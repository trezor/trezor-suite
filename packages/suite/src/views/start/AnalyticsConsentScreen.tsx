import { ReactNode } from 'react';

import styled, { useTheme } from 'styled-components';

import { DataAnalytics } from '@trezor/product-components';
import { DATA_TOS_URL, DOCS_ANALYTICS_URL } from '@trezor/urls';

import { TrezorLink } from 'src/components/suite/TrezorLink';
import { useLegacyAnalytics } from 'src/support/useAnalytics';

import { WelcomeLayoutWithoutModalSwitcher } from '../../components/suite/layouts/WelcomeLayout/WelcomeLayoutWithoutModalSwitcher';

const Content = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
`;

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
            <Content>
                <DataAnalytics
                    onConfirm={onConfirm}
                    analyticsLink={(chunks: ReactNode[]) => (
                        <TrezorLink
                            color={theme.textSubdued}
                            typographyStyle="label"
                            variant="underline"
                            href={DOCS_ANALYTICS_URL}
                        >
                            {chunks}
                        </TrezorLink>
                    )}
                    tosLink={(chunks: ReactNode[]) => (
                        <TrezorLink
                            color={theme.textSubdued}
                            typographyStyle="label"
                            variant="underline"
                            href={DATA_TOS_URL}
                        >
                            {chunks}
                        </TrezorLink>
                    )}
                />
            </Content>
        </WelcomeLayoutWithoutModalSwitcher>
    );
};
