import React from 'react';
import styled from 'styled-components';

import { analytics } from '@trezor/suite-analytics';
import { Switch } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import { SectionItem, ActionColumn, TextColumn } from '@suite-components/Settings';
import { useAnchor } from '@suite-hooks/useAnchor';
import { SettingsAnchor } from '@suite-constants/anchors';
import { useSelector } from '@suite-hooks';
import { hasUserAllowedTracking } from '@suite-utils/analytics';

const PositionedSwitch = styled.div`
    align-self: center;
`;

export const Analytics = () => {
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.Analytics);

    const { enabled, confirmed } = useSelector(state => state.analytics);

    const userAllowedTracking = hasUserAllowedTracking(enabled, confirmed);

    return (
        <SectionItem
            data-test="@settings/analytics"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
            <TextColumn
                title={<Translation id="TR_ALLOW_ANALYTICS" />}
                description={<Translation id="TR_ALLOW_ANALYTICS_DESCRIPTION" />}
            />
            <ActionColumn>
                <PositionedSwitch>
                    <Switch
                        dataTest="@analytics/toggle-switch"
                        isChecked={userAllowedTracking}
                        onChange={() => {
                            if (userAllowedTracking) {
                                analytics.disable();
                            } else {
                                analytics.enable();
                            }
                        }}
                    />
                </PositionedSwitch>
            </ActionColumn>
        </SectionItem>
    );
};
