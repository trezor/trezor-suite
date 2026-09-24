import { injectDesktopApi } from '@suite/desktop-app-api';
import {
    type DesktopUpdateState,
    UpdateState,
    desktopUpdateActions,
    installUpdateThunk,
    selectDesktopUpdate,
} from '@suite/desktop-update';
import { useExternalLink } from '@suite/external-links';
import { getReleaseUrl } from '@suite/github';
import { Translation } from '@suite/intl';
import { Anchor, SettingsAnchor } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { isDevEnv } from '@suite-common/suite-utils';
import { Button, Row } from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';
import { SectionItem } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';

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

type DescriptionProps = {
    desktopUpdateState: DesktopUpdateState;
    openUpdateModal: () => void;
};

const Description = ({ desktopUpdateState, openUpdateModal }: DescriptionProps) => {
    const appVersion = process.env.VERSION || '';
    const { dispatch } = useServices(injectDispatch);
    const openChangelog = () => dispatch(desktopUpdateActions.setIsVersionInfoModalVisible(true));
    const url = useExternalLink(getReleaseUrl(appVersion));

    return (
        <Row columnGap={16} rowGap={4} alignItems="center" flexWrap="wrap">
            <Translation
                id="TR_YOUR_CURRENT_VERSION"
                values={{
                    version: (
                        <Button
                            data-testid="@settings/suite-version"
                            intent="neutral"
                            priority="secondary"
                            size="small"
                            margin={{ left: 4 }}
                            onClick={isDesktop() ? openChangelog : undefined}
                            href={isDesktop() ? undefined : url}
                        >
                            {appVersion}
                            {isDevEnv && '-dev'}
                        </Button>
                    ),
                }}
            />
            {[UpdateState.Available, UpdateState.Downloading, UpdateState.Ready].includes(
                desktopUpdateState.state,
            ) &&
                desktopUpdateState.latest && (
                    <Translation
                        id={getUpdateStateMessage(desktopUpdateState.state)}
                        values={{
                            version: (
                                <Button
                                    data-testid="@settings/suite-new-version"
                                    intent="neutral"
                                    priority="primary"
                                    size="small"
                                    margin={{ left: 4 }}
                                    onClick={openUpdateModal}
                                >
                                    {desktopUpdateState.latest.version}
                                </Button>
                            ),
                        }}
                    />
                )}
        </Row>
    );
};

export const VersionWithUpdate = () => {
    const desktopUpdateState = useSelector(selectDesktopUpdate);
    const { desktopApi, dispatch } = useServices(injectDispatch, injectDesktopApi);

    const checkForUpdates = () => desktopApi.checkForUpdates({ isManual: true });
    const openUpdateModal = () => dispatch(desktopUpdateActions.setIsUpdateModalVisible(true));
    const installAndRestart = () => dispatch(installUpdateThunk({ installNow: true }));

    return (
        <Anchor anchorId={SettingsAnchor.VersionWithUpdate}>
            {({ anchorId, anchorRef, shouldHighlight }) => (
                <SectionItem
                    data-testid={anchorId}
                    ref={anchorRef}
                    shouldHighlight={shouldHighlight}
                    title={<Translation id="TR_SUITE_VERSION" />}
                    description={
                        <Description
                            desktopUpdateState={desktopUpdateState}
                            openUpdateModal={openUpdateModal}
                        />
                    }
                    actions={
                        desktopUpdateState.enabled ? (
                            <>
                                {desktopUpdateState.state === UpdateState.Checking && (
                                    <SectionItem.Button isDisabled intent="brand">
                                        <Translation id="SETTINGS_UPDATE_CHECKING" />
                                    </SectionItem.Button>
                                )}
                                {(desktopUpdateState.state === UpdateState.NotAvailable ||
                                    desktopUpdateState.state ===
                                        UpdateState.EarlyAccessDisable) && (
                                    <SectionItem.Button onClick={checkForUpdates} intent="brand">
                                        <Translation id="SETTINGS_UPDATE_CHECK" />
                                    </SectionItem.Button>
                                )}
                                {desktopUpdateState.state === UpdateState.Available && (
                                    <SectionItem.Button onClick={openUpdateModal} intent="brand">
                                        <Translation id="SETTINGS_UPDATE_AVAILABLE" />
                                    </SectionItem.Button>
                                )}
                                {desktopUpdateState.state === UpdateState.Downloading && (
                                    <SectionItem.Button
                                        onClick={openUpdateModal}
                                        intent="brand"
                                        isLoading
                                    >
                                        <Translation id="SETTINGS_UPDATE_DOWNLOADING" />
                                    </SectionItem.Button>
                                )}
                                {desktopUpdateState.state === UpdateState.Ready && (
                                    <SectionItem.Button onClick={installAndRestart} intent="brand">
                                        <Translation id="SETTINGS_UPDATE_READY" />
                                    </SectionItem.Button>
                                )}
                            </>
                        ) : undefined
                    }
                />
            )}
        </Anchor>
    );
};
