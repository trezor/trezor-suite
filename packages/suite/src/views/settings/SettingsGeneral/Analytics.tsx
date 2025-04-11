import { useSelector } from 'react-redux';

import styled from 'styled-components';

import { selectIsAnalyticsEnabled } from '@suite-common/analytics';
import { Switch } from '@trezor/components';
import { analytics } from '@trezor/suite-analytics';

import { SettingsSectionItem } from 'src/components/settings';
import { ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { SettingsAnchor } from 'src/constants/suite/anchors';

const PositionedSwitch = styled.div`
    align-self: center;
`;

export const Analytics = () => {
    const isAnalyticsEnabled = useSelector(selectIsAnalyticsEnabled);

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
