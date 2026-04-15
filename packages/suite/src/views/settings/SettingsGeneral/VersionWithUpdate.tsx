import {
    type DesktopUpdateState,
    UpdateState,
    desktopUpdateActions,
    installUpdateThunk,
} from '@suite/desktop-update';
import { Translation } from '@suite/intl';
import { SettingsAnchor } from '@suite/router';
import { isDevEnv } from '@suite-common/suite-utils';
import { Button, type ButtonProps } from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';
import { ActionButton, ActionColumn, TextColumn } from '@trezor/product-components';
import { desktopApi } from '@trezor/suite-desktop-api';

import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { useDispatch, useExternalLink, useSelector } from 'src/hooks/suite';
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
    const dispatch = useDispatch();
    const openChangelog = () => dispatch(desktopUpdateActions.setIsVersionInfoModalVisible(true));
    const url = useExternalLink(getReleaseUrl(appVersion));
    const commonButtonProps: Partial<ButtonProps> = {
        'data-testid': '@settings/suite-version',
        intent: 'neutral',
        priority: 'secondary',
        size: 'small',
    } as const;
    const buttonLabel = (
        <>
            {appVersion}
            {isDevEnv && '-dev'}
        </>
    );

    return (
        <div>
            <Translation
                id="TR_YOUR_CURRENT_VERSION"
                values={{
                    version: isDesktop() ? (
                        <Button
                            onClick={() => {
                                openChangelog();
                            }}
                            margin={{ left: 4 }}
                            {...commonButtonProps}
                        >
                            {buttonLabel}
                        </Button>
                    ) : (
                        <Button href={url} margin={{ left: 4 }} {...commonButtonProps}>
                            {buttonLabel}
                        </Button>
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
                                    <Button
                                        intent="critical"
                                        size="small"
                                        href={getReleaseUrl(desktopUpdateState.latest.version)}
                                    >
                                        {desktopUpdateState.latest.version}
                                    </Button>
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

    const checkForUpdates = () => desktopApi.checkForUpdates({ isManual: true });
    const maximizeUpdateModal = () => dispatch(desktopUpdateActions.setIsUpdateModalVisible(true));
    const installAndRestart = () => dispatch(installUpdateThunk({ installNow: true }));

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.VersionWithUpdate}>
            <TextColumn
                title={<Translation id="TR_SUITE_VERSION" />}
                description={<Description desktopUpdateState={desktopUpdateState} />}
            />
            {desktopUpdateState.enabled && (
                <ActionColumn>
                    {desktopUpdateState.state === UpdateState.Checking && (
                        <ActionButton isDisabled intent="brand">
                            <Translation id="SETTINGS_UPDATE_CHECKING" />
                        </ActionButton>
                    )}
                    {(desktopUpdateState.state === UpdateState.NotAvailable ||
                        desktopUpdateState.state === UpdateState.EarlyAccessDisable) && (
                        <ActionButton onClick={checkForUpdates} intent="brand">
                            <Translation id="SETTINGS_UPDATE_CHECK" />
                        </ActionButton>
                    )}
                    {desktopUpdateState.state === UpdateState.Available && (
                        <ActionButton onClick={maximizeUpdateModal} intent="brand">
                            <Translation id="SETTINGS_UPDATE_AVAILABLE" />
                        </ActionButton>
                    )}
                    {desktopUpdateState.state === UpdateState.Downloading && (
                        <ActionButton onClick={maximizeUpdateModal} intent="brand">
                            <Translation id="SETTINGS_UPDATE_DOWNLOADING" />
                        </ActionButton>
                    )}
                    {desktopUpdateState.state === UpdateState.Ready && (
                        <ActionButton onClick={installAndRestart} intent="brand">
                            <Translation id="SETTINGS_UPDATE_READY" />
                        </ActionButton>
                    )}
                </ActionColumn>
            )}
        </SettingsSectionItem>
    );
};
