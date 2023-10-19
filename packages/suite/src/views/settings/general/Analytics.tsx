import { useSelector } from 'react-redux';

import styled from 'styled-components';
import { Translation } from 'src/components/suite/Translation';
import { SectionItem, ActionColumn, TextColumn } from 'src/components/suite/Settings';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';

import { selectHasUserAllowedTracking } from '@suite-common/analytics';
import { Switch } from '@trezor/components';
import { analytics } from '@trezor/suite-analytics';

const PositionedSwitch = styled.div`
    align-self: center;
`;

export const Analytics = () => {
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.Analytics);

    const userAllowedTracking = useSelector(selectHasUserAllowedTracking);

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
