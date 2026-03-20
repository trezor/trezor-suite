import styled from 'styled-components';

import { GoogleClient } from '@suite/metadata';
import { suiteSettingsActions } from '@suite/settings';
import { type OAuthServerEnvironment } from '@suite-common/metadata-types';

import { ActionColumn, ActionSelect, SectionItem, TextColumn } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';

const StyledActionSelect = styled(ActionSelect)`
    min-width: 256px;
`;

export const OAuthApi = () => {
    const debug = useSelector(state => state.suiteSettings.debug);
    const dispatch = useDispatch();

    const options = Object.entries(GoogleClient.servers).map(([environment, server]) => ({
        label: server,
        value: environment,
    }));
    const selectedOption =
        options.find(option => option.value === debug.oauthServerEnvironment) || options[0];

    const handleChange = (item: { value: OAuthServerEnvironment }) => {
        dispatch(suiteSettingsActions.setDebugMode({ oauthServerEnvironment: item.value }));
        GoogleClient.setEnvironment(item.value);
    };

    return (
        <SectionItem>
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
        </SectionItem>
    );
};
