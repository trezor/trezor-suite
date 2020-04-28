import React from 'react';
import { Switch } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import { SectionItem, ActionColumn, TextColumn } from '@suite-components/Settings';
import { useAnalytics } from '@suite-hooks';

const Analytics = () => {
    const { init, dispose, enabled } = useAnalytics();
    return (
        <SectionItem>
            <TextColumn
                title={<Translation id="TR_ALLOW_ANALYTICS" />}
                description={<Translation id="TR_ALLOW_ANALYTICS_DESCRIPTION" />}
                // todo: disabled until we get where to redirect
                // learnMore="todo some link"
            />
            <ActionColumn>
                <Switch
                    checked={enabled}
                    onChange={() => {
                        if (enabled) {
                            return dispose();
                        }
                        init();
                    }}
                />
            </ActionColumn>
        </SectionItem>
    );
};

export default Analytics;
