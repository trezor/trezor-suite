import styled from 'styled-components';

import { type InvityServerEnvironment, invityAPI } from '@suite-common/trading';
import { desktopApi } from '@trezor/suite-desktop-api';

import { setDebugMode } from 'src/actions/suite/suiteActions';
import { ActionColumn, ActionSelect, SectionItem, TextColumn } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';

const StyledActionSelect = styled(ActionSelect)`
    min-width: 256px;
`;

export const InvityApi = () => {
    const debug = useSelector(state => state.suite.settings.debug);
    const dispatch = useDispatch();

    const invityApiServerOptions = Object.entries(invityAPI.SERVERS).map(
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
        if (desktopApi.available) {
            desktopApi.reloadBrowserWindow();
        } else {
            window.location.reload();
        }
    };

    return (
        <SectionItem>
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
        </SectionItem>
    );
};
