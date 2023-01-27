import React from 'react';
import styled from 'styled-components';

import { ActionColumn, ActionSelect, SectionItem, TextColumn } from '@suite-components/Settings';
import * as suiteActions from '@suite-actions/suiteActions';
import { useSelector, useActions } from '@suite-hooks';
import invityAPI from '@suite-services/invityAPI';
import type { InvityServerEnvironment } from '@suite-common/invity';
import { useAnchor } from '@suite-hooks/useAnchor';
import { SettingsAnchor } from '@suite-constants/anchors';
import { reloadApp } from '@suite-utils/reload';

const StyledActionSelect = styled(ActionSelect)`
    min-width: 256px;
`;

export const InvityApi = () => {
    const { setDebugMode } = useActions({
        setDebugMode: suiteActions.setDebugMode,
    });
    const { debug } = useSelector(state => ({
        debug: state.suite.settings.debug,
    }));
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.InvityApi);

    const invityApiServerOptions = Object.entries(invityAPI.servers).map(
        ([environment, server]) => ({
            label: server,
            value: environment as InvityServerEnvironment,
        }),
    );

    const selectedInvityApiServer =
        invityApiServerOptions.find(s => s.value === debug.invityServerEnvironment) ||
        invityApiServerOptions[0];

    return (
        <SectionItem
            data-test="@settings/debug/invity-api"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
            <TextColumn
                title="API server"
                description="Set the server url for buy and exchange features"
            />
            <ActionColumn>
                <StyledActionSelect
                    onChange={(item: { value: InvityServerEnvironment; label: string }) => {
                        setDebugMode({
                            invityServerEnvironment: item.value,
                        });
                        invityAPI.setInvityServersEnvironment(item.value);
                        // reload the Suite to reinitialize everything, with a slight delay to let the browser save the settings
                        reloadApp(100);
                    }}
                    value={selectedInvityApiServer}
                    options={invityApiServerOptions}
                />
            </ActionColumn>
        </SectionItem>
    );
};
