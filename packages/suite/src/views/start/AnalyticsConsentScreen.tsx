import { ReactNode } from 'react';

import styled, { useTheme } from 'styled-components';

import { analytics } from '@suite-common/analytics';
import { DataAnalytics } from '@trezor/components';
import { DATA_TOS_URL, DOCS_ANALYTICS_URL } from '@trezor/urls';

import { rerun } from '../../actions/recovery/recoveryActions';
import { TrezorLink } from '../../components/suite';
import { WelcomeLayoutWithoutModalSwitcher } from '../../components/suite/layouts/WelcomeLayout/WelcomeLayoutWithoutModalSwitcher';
import { useDispatch, useSelector } from '../../hooks/suite';

const Content = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%; /* to fit the DeviceAuthenticity steps  */
`;

export const AnalyticsConsentScreen = () => {
    const recovery = useSelector(state => state.recovery);

    const dispatch = useDispatch();
    const theme = useTheme();

    const onConfirm = (trackingEnabled: boolean) => {
        if (trackingEnabled) {
            analytics.enable();
        } else {
            analytics.disable();
        }
        if (recovery.status === 'in-progress') {
            // T2T1 remember the recovery state and should continue with recovery
            dispatch(rerun());
        }
    };

    return (
        <WelcomeLayoutWithoutModalSwitcher>
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
