import { openEarlyAccessSetup } from '@suite/desktop-update';
import { Translation } from '@suite/intl';
import { SettingsAnchor } from '@suite/router';
import { Row } from '@trezor/components';
import { ActionButton, ActionColumn, TextColumn } from '@trezor/product-components';
import { desktopApi } from '@trezor/suite-desktop-api';

import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { useDispatch, useSelector } from 'src/hooks/suite';

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
                    <Row alignItems="center">
                        <Translation
                            id={
                                desktopUpdate.allowPrerelease
                                    ? 'TR_EARLY_ACCESS_DESCRIPTION_ENABLED'
                                    : 'TR_EARLY_ACCESS_DESCRIPTION'
                            }
                        />
                    </Row>
                }
            />
            <ActionColumn>
                <ActionButton
                    onClick={setupEarlyAccess}
                    intent="brand"
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
