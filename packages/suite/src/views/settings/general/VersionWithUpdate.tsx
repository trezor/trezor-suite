import React, { useCallback } from 'react';
import styled from 'styled-components';
import { desktopApi } from '@trezor/suite-desktop-api';

import * as desktopUpdateActions from '@suite-actions/desktopUpdateActions';
import { VersionWithGithubTooltip } from '@suite-components/VersionWithGithubTooltip';
import { Translation } from '@suite-components';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { useSelector, useActions } from '@suite-hooks';
import { UpdateState } from '@suite-reducers/desktopUpdateReducer';
import { isDevEnv } from '@suite-common/suite-utils';
import { useAnchor } from '@suite-hooks/useAnchor';
import { SettingsAnchor } from '@suite-constants/anchors';

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

const Version = styled.div`
    span {
        display: flex;
        align-items: center;
    }
`;

export const VersionWithUpdate = () => {
    const { setUpdateWindow, installUpdate } = useActions({
        setUpdateWindow: desktopUpdateActions.setUpdateWindow,
        installUpdate: desktopUpdateActions.installUpdate,
    });
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.VersionWithUpdate);

    const { desktopUpdate } = useSelector(state => ({
        desktopUpdate: state.desktopUpdate,
    }));

    const checkForUpdates = useCallback(() => desktopApi.checkForUpdates(true), []);
    const maximizeUpdater = useCallback(() => setUpdateWindow('maximized'), [setUpdateWindow]);

    return (
        <SectionItem
            data-test="@settings/version"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
            <TextColumn
                title={<Translation id="TR_SUITE_VERSION" />}
                description={
                    <Version>
                        <Translation
                            id="TR_YOUR_CURRENT_VERSION"
                            values={{
                                version: (
                                    <VersionWithGithubTooltip
                                        appVersion={process.env.VERSION || ''}
                                        isDev={isDevEnv}
                                    />
                                ),
                            }}
                        />
                        {[
                            UpdateState.Available,
                            UpdateState.Downloading,
                            UpdateState.Ready,
                        ].includes(desktopUpdate.state) &&
                            desktopUpdate.latest && (
                                <>
                                    &nbsp;
                                    <Translation
                                        id={getUpdateStateMessage(desktopUpdate.state)}
                                        values={{
                                            version: (
                                                <VersionWithGithubTooltip
                                                    appVersion={desktopUpdate.latest.version}
                                                />
                                            ),
                                        }}
                                    />
                                </>
                            )}
                    </Version>
                }
            />
            {desktopUpdate.enabled && (
                <ActionColumn>
                    {desktopUpdate.state === UpdateState.Checking && (
                        <ActionButton isDisabled variant="secondary">
                            <Translation id="SETTINGS_UPDATE_CHECKING" />
                        </ActionButton>
                    )}
                    {[
                        UpdateState.NotAvailable,
                        UpdateState.EarlyAccessDisable,
                        UpdateState.EarlyAccessEnable,
                    ].includes(desktopUpdate.state) && (
                        <ActionButton onClick={checkForUpdates} variant="secondary">
                            <Translation id="SETTINGS_UPDATE_CHECK" />
                        </ActionButton>
                    )}
                    {desktopUpdate.state === UpdateState.Available && (
                        <ActionButton onClick={maximizeUpdater} variant="secondary">
                            <Translation id="SETTINGS_UPDATE_AVAILABLE" />
                        </ActionButton>
                    )}
                    {desktopUpdate.state === UpdateState.Downloading && (
                        <ActionButton onClick={maximizeUpdater} variant="secondary">
                            <Translation id="SETTINGS_UPDATE_DOWNLOADING" />
                        </ActionButton>
                    )}
                    {desktopUpdate.state === UpdateState.Ready && (
                        <ActionButton onClick={() => installUpdate()} variant="secondary">
                            <Translation id="SETTINGS_UPDATE_READY" />
                        </ActionButton>
                    )}
                </ActionColumn>
            )}
        </SectionItem>
    );
};
