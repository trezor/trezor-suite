import styled from 'styled-components';

import { desktopApi } from '@trezor/suite-desktop-api';

import { SettingsSectionItem } from 'src/components/settings';
import { ActionButton, ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { openEarlyAccessSetup } from 'src/actions/suite/desktopUpdateActions';
import { SettingsAnchor } from 'src/constants/suite/anchors';

const Version = styled.div`
    span {
        display: flex;
        align-items: center;
    }
`;

export const EarlyAccess = () => {
    const desktopUpdate = useSelector(state => state.desktopUpdate);
    const dispatch = useDispatch();

    const setupEarlyAccess = () => {
        dispatch(openEarlyAccessSetup(desktopUpdate.allowPrerelease));
        desktopApi.cancelUpdate(); // stop downloading the update if it is in progress to prevent confusing state switching
    };

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.EarlyAccess}>
            <TextColumn
                title={
                    <Translation
                        id={
                            desktopUpdate.allowPrerelease
                                ? 'TR_EARLY_ACCESS_ENABLED'
                                : 'TR_EARLY_ACCESS'
                        }
                    />
                }
                description={
                    <Version>
                        <Translation
                            id={
                                desktopUpdate.allowPrerelease
                                    ? 'TR_EARLY_ACCESS_DESCRIPTION_ENABLED'
                                    : 'TR_EARLY_ACCESS_DESCRIPTION'
                            }
                        />
                    </Version>
                }
            />
            <ActionColumn>
                <ActionButton
                    onClick={setupEarlyAccess}
                    variant="primary"
                    data-testid="@settings/early-access-join-button"
                >
                    <Translation
                        id={
                            desktopUpdate.allowPrerelease
                                ? 'TR_EARLY_ACCESS_DISABLE'
                                : 'TR_EARLY_ACCESS_ENABLE'
                        }
                    />
                </ActionButton>
            </ActionColumn>
        </SettingsSectionItem>
    );
};
