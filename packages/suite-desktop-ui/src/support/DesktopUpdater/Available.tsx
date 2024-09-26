import { ReactNode } from 'react';

import styled from 'styled-components';

import {
    Card,
    Checkbox,
    Column,
    ElevationUp,
    Icon,
    Link,
    Markdown,
    NewModal,
    Paragraph,
    Row,
    Text,
    useElevation,
} from '@trezor/components';
import { desktopApi, UpdateInfo } from '@trezor/suite-desktop-api';
import { borders, Elevation, mapElevationToBackground, spacings, spacingsPx } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { getReleaseUrl } from 'src/services/github';
import { download } from 'src/actions/suite/desktopUpdateActions';

const ChangelogWrapper = styled.div<{ $elevation: Elevation }>`
    background-color: ${({ theme, $elevation }) => mapElevationToBackground({ theme, $elevation })};
    border-radius: ${borders.radii.md};
    max-height: 400px;
    overflow-y: auto;
    padding: ${spacingsPx.md} ${spacingsPx.xl};
`;

const GrayTag = styled.div`
    border-radius: ${borders.radii.full};
    background-color: ${({ theme }) => theme.backgroundNeutralSubtleOnElevation0};
    padding: ${spacingsPx.xxxs} ${spacingsPx.xs};
    color: ${({ theme }) => theme.textSubdued};
`;

const GreenTag = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xxs};
    border-radius: ${borders.radii.full};
    background-color: ${({ theme }) => theme.backgroundPrimarySubtleOnElevation0};
    padding: ${spacingsPx.xxxs} ${spacingsPx.xs};
`;

const NewTag = () => (
    <GreenTag>
        <Icon name="sparkleFilled" variant="primary" size="small" />
        <Text variant="primary">
            <Translation id="TR_UPDATE_MODAL_ENABLE_AUTO_UPDATES_NEW_TAG" />
        </Text>
    </GreenTag>
);

const Changelog = ({ children }: { children: ReactNode }) => {
    const { elevation } = useElevation();

    return <ChangelogWrapper $elevation={elevation}>{children}</ChangelogWrapper>;
};

interface VersionNameProps {
    latestVersion?: string;
    prerelease: boolean;
}

const getVersionName = ({ latestVersion, prerelease }: VersionNameProps): string => {
    if (latestVersion === undefined) {
        return '';
    }

    if (prerelease !== undefined) {
        return latestVersion;
    }

    if (!latestVersion.includes('-')) {
        return `${latestVersion}-beta`;
    }

    return latestVersion;
};

interface AvailableProps {
    onCancel: () => void;
    latest: UpdateInfo | undefined;
    isAutomaticUpdateEnabled: boolean;
}

export const Available = ({ onCancel, latest, isAutomaticUpdateEnabled }: AvailableProps) => {
    const dispatch = useDispatch();

    const downloadUpdate = () => {
        dispatch(download());
        desktopApi.downloadUpdate();
    };

    const suiteCurrentVersion = process.env.VERSION || '';
    const suiteNewVersion = getVersionName({
        latestVersion: latest?.version,
        prerelease: !!latest?.prerelease,
    });

    const handleToggleAutoUpdateClick = () =>
        desktopApi.setAutomaticUpdateEnabled(!isAutomaticUpdateEnabled);

    return (
        <NewModal
            heading={<Translation id="TR_UPDATE_MODAL_AVAILABLE_HEADING" />}
            description={
                <Translation
                    id="TR_UPDATE_MODAL_YOUR_VERSION"
                    values={{ version: suiteCurrentVersion }}
                />
            }
            onCancel={onCancel}
            bottomContent={
                <>
                    <NewModal.Button onClick={downloadUpdate} variant="primary">
                        <Translation id="TR_UPDATE_MODAL_START_DOWNLOAD" />
                    </NewModal.Button>
                    <NewModal.Button onClick={onCancel} variant="tertiary">
                        <Translation id="TR_UPDATE_MODAL_NOT_NOW" />
                    </NewModal.Button>
                </>
            }
        >
            <Column gap={spacings.xs} alignItems="start">
                <div>
                    <Paragraph typographyStyle="highlight" variant="primary">
                        <Translation
                            id="TR_VERSION_HAS_RELEASED"
                            values={{ version: suiteNewVersion }}
                        />
                    </Paragraph>
                    <Paragraph typographyStyle="hint" variant="tertiary">
                        <Translation id="TR_WERE_CONSTANTLY_WORKING_TO_IMPROVE" />
                    </Paragraph>
                </div>

                <ElevationUp>
                    <Changelog>
                        {latest?.changelog ? (
                            <Markdown>{latest?.changelog}</Markdown>
                        ) : (
                            <Translation id="TR_COULD_NOT_RETRIEVE_CHANGELOG" />
                        )}
                    </Changelog>
                </ElevationUp>

                <Row justifyContent="space-between" width="100%">
                    <Link variant="nostyle" href={getReleaseUrl(latest?.version ?? '')}>
                        <GrayTag>
                            <Translation id="TR_READ_ALL_ON_GITHUB" />
                        </GrayTag>
                    </Link>

                    {latest?.releaseDate && <Text variant="tertiary">{latest?.releaseDate}</Text>}
                </Row>

                <ElevationUp>
                    <Card>
                        <Row justifyContent="start" gap={spacings.xs}>
                            <Checkbox onClick={handleToggleAutoUpdateClick}>
                                <Translation id="TR_UPDATE_MODAL_ENABLE_AUTO_UPDATES" />
                            </Checkbox>
                            <NewTag />
                        </Row>
                    </Card>
                </ElevationUp>
            </Column>
        </NewModal>
    );
};
