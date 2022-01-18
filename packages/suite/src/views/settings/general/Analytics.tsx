import React from 'react';
import styled from 'styled-components';

import { Switch } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import { SectionItem, ActionColumn, TextColumn } from '@suite-components/Settings';
import { useAnalytics } from '@suite-hooks';

const PositionedSwitch = styled.div`
    align-self: center;
`;

export const Analytics = () => {
    const { enable, dispose, enabled } = useAnalytics();

    return (
        <SectionItem>
            <TextColumn
                title={<Translation id="TR_ALLOW_ANALYTICS" />}
                description={<Translation id="TR_ALLOW_ANALYTICS_DESCRIPTION" />}
            />
            <ActionColumn>
                <PositionedSwitch>
                    <Switch
                        data-test="@analytics/toggle-switch"
                        checked={!!enabled}
                        onChange={() => {
                            if (enabled) {
                                return dispose();
                            }
                            enable();
                        }}
                    />
                </PositionedSwitch>
            </ActionColumn>
        </SectionItem>
    );
};
