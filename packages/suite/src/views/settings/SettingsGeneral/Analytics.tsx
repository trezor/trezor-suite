import { useSelector } from 'react-redux';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { SettingsAnchor } from '@suite/router';
import { selectIsAnalyticsEnabled } from '@suite-common/analytics-redux';
import { Switch } from '@trezor/components';
import { ActionColumn, TextColumn } from '@trezor/product-components';

import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { useAnalytics } from 'src/support/useAnalytics';

const PositionedSwitch = styled.div`
    align-self: center;
`;

export const Analytics = () => {
    const isAnalyticsEnabled = useSelector(selectIsAnalyticsEnabled);
    const analytics = useAnalytics();

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.Analytics}>
            <TextColumn
                title={<Translation id="TR_ALLOW_ANALYTICS" />}
                description={<Translation id="TR_ALLOW_ANALYTICS_DESCRIPTION" />}
            />
            <ActionColumn>
                <PositionedSwitch>
                    <Switch
                        data-testid="@analytics/toggle-switch"
                        isChecked={isAnalyticsEnabled}
                        onChange={() => {
                            if (isAnalyticsEnabled) {
                                analytics.disable();
                            } else {
                                analytics.enable();
                            }
                        }}
                    />
                </PositionedSwitch>
            </ActionColumn>
        </SettingsSectionItem>
    );
};
