import styled from 'styled-components';

import { Switch } from '@trezor/components';

import { requestBioAuthChangeThunk } from 'src/actions/suite/bioAuthThunks';
import { SettingsSectionItem } from 'src/components/settings';
import { ActionColumn, TextColumn } from 'src/components/suite';
import { Translation } from 'src/components/suite/Translation';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDispatch, useSelector } from 'src/hooks/suite';
import {
    selectBioAuthChangeNextValue,
    selectBioAuthEnabled,
    selectIsRequestingBioAuthChange,
} from 'src/reducers/desktop';

const PositionedSwitch = styled.div`
    align-self: center;
`;

export const BioAuthSettings = () => {
    const biometricAuthEnabled = useSelector(selectBioAuthEnabled);
    const isRequestingBioAuthChange = useSelector(selectIsRequestingBioAuthChange);
    const bioAuthChangeNextValue = useSelector(selectBioAuthChangeNextValue);
    const optimisticValue = bioAuthChangeNextValue ?? biometricAuthEnabled;
    const dispatch = useDispatch();

    const onChange = () => {
        dispatch(requestBioAuthChangeThunk());
    };

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.AddressDisplay}>
            <TextColumn
                title={<Translation id="TR_BIO_AUTH" />}
                description={<Translation id="TR_BIO_AUTH_DESCRIPTION" />}
            />
            <ActionColumn>
                <PositionedSwitch>
                    <Switch
                        isDisabled={isRequestingBioAuthChange}
                        data-testid="@analytics/toggle-switch"
                        isChecked={optimisticValue}
                        onChange={onChange}
                    />
                </PositionedSwitch>
            </ActionColumn>
        </SettingsSectionItem>
    );
};
