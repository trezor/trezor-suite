import React from 'react';

import { Switch } from '@trezor/components';
import { useAnalytics, useSelector } from '@suite-hooks';
import { ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { Translation } from '@suite-components';

export const Tor = () => {
    const analytics = useAnalytics();
    const { tor } = useSelector(state => ({
        tor: state.suite.tor,
    }));

    return (
        <SectionItem>
            <TextColumn
                title={<Translation id="TR_TOR_TITLE" />}
                description={
                    <Translation
                        id="TR_TOR_DESCRIPTION"
                        values={{
                            lineBreak: <br />,
                        }}
                    />
                }
                buttonLink="https://www.torproject.org/"
            />
            <ActionColumn>
                <Switch
                    data-test="@settings/general/tor-switch"
                    checked={tor}
                    onChange={() => {
                        analytics.report({
                            type: 'menu/toggle-tor',
                            payload: {
                                value: !tor,
                            },
                        });
                        window.desktopApi!.toggleTor(!tor);
                    }}
                />
            </ActionColumn>
        </SectionItem>
    );
};
