import styled from 'styled-components';

import { SettingsSectionItem } from 'src/components/settings';
import { ActionColumn, ActionSelect, TextColumn } from 'src/components/suite';
import GoogleClient from 'src/services/google';
import { setDebugMode } from 'src/actions/suite/suiteActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import type { OAuthServerEnvironment } from 'src/types/suite/metadata';
import { SettingsAnchor } from 'src/constants/suite/anchors';

const StyledActionSelect = styled(ActionSelect)`
    min-width: 256px;
`;

export const OAuthApi = () => {
    const debug = useSelector(state => state.suite.settings.debug);
    const dispatch = useDispatch();

    const options = Object.entries(GoogleClient.servers).map(([environment, server]) => ({
        label: server,
        value: environment,
    }));
    const selectedOption =
        options.find(option => option.value === debug.oauthServerEnvironment) || options[0];

    const handleChange = (item: { value: OAuthServerEnvironment }) => {
        dispatch(setDebugMode({ oauthServerEnvironment: item.value }));
        GoogleClient.setEnvironment(item.value);
    };

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.OAuthApi}>
            <TextColumn
                title="Google auth server"
                description="Set the authorisation server url for labeling in Google Drive"
            />
            <ActionColumn>
                <StyledActionSelect
                    onChange={handleChange}
                    value={selectedOption}
                    options={options}
                />
            </ActionColumn>
        </SettingsSectionItem>
    );
};
