import { isDevEnv } from '@suite-common/suite-utils';
import { Button } from '@trezor/components';
import { desktopApi } from '@trezor/suite-desktop-api';

import { installUpdate, setUpdateModalVisibility } from 'src/actions/suite/desktopUpdateActions';
import { SettingsSectionItem } from 'src/components/settings';
import {
    ActionButton,
    ActionColumn,
    TextColumn,
    Translation,
    TrezorLink,
} from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { DesktopUpdateState, UpdateState } from 'src/reducers/suite/desktopUpdateReducer';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { getReleaseUrl } from 'src/services/github';

const getUpdateStateMessage = (state: UpdateState) => {
    switch (state) {
        case UpdateState.Downloading:
            return 'TR_YOUR_NEW_VERSION_IS_DOWNLOADING';
        case UpdateState.Ready:
            return 'TR_YOUR_NEW_VERSION_IS_READY';
        case UpdateState.Available:
        default:
            return 'TR_YOUR_NEW_VERSION';
    }
};

const Description = ({ desktopUpdateState }: { desktopUpdateState: DesktopUpdateState }) => {
    const appVersion = process.env.VERSION || '';

    return (
        <div>
            <Translation
                id="TR_YOUR_CURRENT_VERSION"
                values={{
                    version: (
                        <TrezorLink href={getReleaseUrl(appVersion)} variant="nostyle">
                            <Button
                                variant="tertiary"
                                size="tiny"
                                icon="arrowUpRight"
                                iconAlignment="right"
                            >
                                {appVersion}
                                {isDevEnv && '-dev'}
                            </Button>
                        </TrezorLink>
                    ),
                }}
            />
            {[UpdateState.Available, UpdateState.Downloading, UpdateState.Ready].includes(
                desktopUpdateState.state,
            ) &&
                desktopUpdateState.latest && (
                    <>
                        &nbsp;
                        <Translation
                            id={getUpdateStateMessage(desktopUpdateState.state)}
                            values={{
                                version: (
                                    <TrezorLink href={getReleaseUrl(appVersion)} variant="nostyle">
                                        <Button
                                            variant="destructive"
                                            size="tiny"
                                            icon="arrowUpRight"
                                            iconAlignment="right"
                                        >
                                            {desktopUpdateState.latest.version}
                                        </Button>
                                    </TrezorLink>
                                ),
                            }}
                        />
                    </>
                )}
        </div>
    );
};

export const VersionWithUpdate = () => {
    const desktopUpdateState = useSelector(state => state.desktopUpdate);
    const dispatch = useDispatch();

    const checkForUpdates = () => desktopApi.checkForUpdates(true);
    const maximizeUpdateModal = () => dispatch(setUpdateModalVisibility('maximized'));
    const installAndRestart = () => dispatch(installUpdate({ shouldInstallOnQuit: false }));

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.VersionWithUpdate}>
            <TextColumn
                title={<Translation id="TR_SUITE_VERSION" />}
                description={<Description desktopUpdateState={desktopUpdateState} />}
            />
            {desktopUpdateState.enabled && (
                <ActionColumn>
                    {desktopUpdateState.state === UpdateState.Checking && (
                        <ActionButton isDisabled variant="primary">
                            <Translation id="SETTINGS_UPDATE_CHECKING" />
                        </ActionButton>
                    )}
                    {desktopUpdateState.state === UpdateState.NotAvailable && (
                        <ActionButton onClick={checkForUpdates} variant="primary">
                            <Translation id="SETTINGS_UPDATE_CHECK" />
                        </ActionButton>
                    )}
                    {desktopUpdateState.state === UpdateState.Available && (
                        <ActionButton onClick={maximizeUpdateModal} variant="primary">
                            <Translation id="SETTINGS_UPDATE_AVAILABLE" />
                        </ActionButton>
                    )}
                    {desktopUpdateState.state === UpdateState.Downloading && (
                        <ActionButton onClick={maximizeUpdateModal} variant="primary">
                            <Translation id="SETTINGS_UPDATE_DOWNLOADING" />
                        </ActionButton>
                    )}
                    {desktopUpdateState.state === UpdateState.Ready && (
                        <ActionButton onClick={installAndRestart} variant="primary">
                            <Translation id="SETTINGS_UPDATE_READY" />
                        </ActionButton>
                    )}
                </ActionColumn>
            )}
        </SettingsSectionItem>
    );
};
