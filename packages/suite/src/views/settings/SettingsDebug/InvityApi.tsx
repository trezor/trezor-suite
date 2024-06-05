import styled from 'styled-components';

import { SettingsSectionItem } from 'src/components/settings';
import { ActionColumn, ActionSelect, TextColumn } from 'src/components/suite';
import { setDebugMode } from 'src/actions/suite/suiteActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import invityAPI from 'src/services/suite/invityAPI';
import type { InvityServerEnvironment } from '@suite-common/invity';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { reloadApp } from 'src/utils/suite/reload';

const StyledActionSelect = styled(ActionSelect)`
    min-width: 256px;
`;

export const InvityApi = () => {
    const debug = useSelector(state => state.suite.settings.debug);
    const dispatch = useDispatch();

    const invityApiServerOptions = Object.entries(invityAPI.servers).map(
        ([environment, server]) => ({
            label: server,
            value: environment as InvityServerEnvironment,
        }),
    );
    const selectedInvityApiServer =
        invityApiServerOptions.find(s => s.value === debug.invityServerEnvironment) ||
        invityApiServerOptions[0];

    const handleChange = (item: { value: InvityServerEnvironment; label: string }) => {
        dispatch(setDebugMode({ invityServerEnvironment: item.value }));
        invityAPI.setInvityServersEnvironment(item.value);
        // reload the Suite to reinitialize everything, with a slight delay to let the browser save the settings
        reloadApp(100);
    };

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.InvityApi}>
            <TextColumn
                title="API server"
                description="Set the server url for buy and exchange features"
            />
            <ActionColumn>
                <StyledActionSelect
                    onChange={handleChange}
                    value={selectedInvityApiServer}
                    options={invityApiServerOptions}
                />
            </ActionColumn>
        </SettingsSectionItem>
    );
};
