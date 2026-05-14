import { useSelector } from 'react-redux';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { Anchor, SettingsAnchor } from '@suite/router';
import { selectIsAnalyticsEnabled } from '@suite-common/analytics-redux';
import { Switch } from '@trezor/components';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { useAnalytics } from 'src/support/useAnalytics';

const PositionedSwitch = styled.div`
    align-self: center;
`;

export const Analytics = () => {
    const isAnalyticsEnabled = useSelector(selectIsAnalyticsEnabled);
    const analytics = useAnalytics();

    return (
        <Anchor anchorId={SettingsAnchor.Analytics}>
            {({ anchorId, anchorRef, shouldHighlight }) => (
                <SectionItem
                    data-testid={anchorId}
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
                </SectionItem>
            )}
        </Anchor>
    );
};
