import React from 'react';
import styled from 'styled-components';

import { ActionColumn, ActionSelect, SectionItem, TextColumn } from '@suite-components/Settings';
import * as suiteActions from '@suite-actions/suiteActions';
import { useSelector, useActions } from '@suite-hooks';
import invityAPI from '@suite-services/invityAPI';
import { useAnchor } from '@suite-hooks/useAnchor';
import { SettingsAnchor } from '@suite-constants/anchors';

const StyledActionSelect = styled(ActionSelect)`
    min-width: 250px;
`;

const invityApiServerOptions = [
    {
        label: invityAPI.productionAPIServer,
        value: invityAPI.productionAPIServer,
    },
    {
        label: invityAPI.stagingAPIServer,
        value: invityAPI.stagingAPIServer,
    },
    {
        label: invityAPI.localhostAPIServer,
        value: invityAPI.localhostAPIServer,
    },
];

export const InvityApi = () => {
    const { setDebugMode } = useActions({
        setDebugMode: suiteActions.setDebugMode,
    });
    const { debug } = useSelector(state => ({
        debug: state.suite.settings.debug,
    }));
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.InvityApi);

    const selectedInvityApiServer =
        invityApiServerOptions.find(s => s.value === debug.invityAPIUrl) ||
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
                    noTopLabel
                    onChange={(item: { value: string; label: string }) => {
                        setDebugMode({
                            invityAPIUrl: item.value,
                        });
                        invityAPI.setInvityAPIServer(item.value);
                    }}
                    value={selectedInvityApiServer}
                    options={invityApiServerOptions}
                />
            </ActionColumn>
        </SectionItem>
    );
};
