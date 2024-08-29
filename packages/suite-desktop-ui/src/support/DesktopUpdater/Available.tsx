import styled from 'styled-components';

import { Button, H2, Link, Markdown } from '@trezor/components';
import { desktopApi, UpdateInfo } from '@trezor/suite-desktop-api';
import { borders } from '@trezor/theme';

import { Translation, Modal } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { getReleaseUrl } from 'src/services/github';
import { download } from 'src/actions/suite/desktopUpdateActions';

const GreenH2 = styled(H2)`
    text-align: left;
    color: ${({ theme }) => theme.legacy.TYPE_GREEN};
`;

const ChangelogWrapper = styled.div`
    margin: 20px 0;
    background: ${({ theme }) => theme.legacy.BG_GREY};
    border-radius: ${borders.radii.xs};
    max-height: 400px;
    overflow-y: auto;
    padding: 16px 20px;
`;

const StyledLink = styled(Link)`
    align-self: start;
`;

const StyledModal = styled(Modal)`
    ${Modal.BottomBar} {
        > * {
            flex: 1;
        }
    }
`;

interface VersionNameProps {
    latestVersion?: string;
    prerelease: boolean;
}

const getVersionName = ({ latestVersion, prerelease }: VersionNameProps): string => {
    if (!latestVersion) {
        // fallback for undefined version
        return '';
    }
    if (!prerelease) {
        // regular case
        return latestVersion;
    }
    if (!latestVersion.includes('-')) {
        // add beta label for pre-releases, but prevent versions like '21.10.1-alpha-beta'
        return `${latestVersion}-beta`;
    }

    // fallback for pre-release versions already including some pre-release components
    return latestVersion;
};

interface AvailableProps {
    hideWindow: () => void;
    isCancelable: boolean;
    latest?: UpdateInfo;
}

export const Available = ({ hideWindow, isCancelable, latest }: AvailableProps) => {
    const dispatch = useDispatch();

    const downloadUpdate = () => {
        dispatch(download());
        desktopApi.downloadUpdate();
    };

    return (
        <StyledModal
            heading={<Translation id="TR_UPDATE_MODAL_AVAILABLE_HEADING" />}
            isCancelable={isCancelable}
            onCancel={hideWindow}
            bottomBarComponents={
                <>
                    <Button onClick={hideWindow} variant="tertiary">
                        <Translation id="TR_UPDATE_MODAL_NOT_NOW" />
                    </Button>
                    <Button onClick={downloadUpdate} variant="primary">
                        <Translation id="TR_UPDATE_MODAL_START_DOWNLOAD" />
                    </Button>
                </>
            }
        >
            <GreenH2>
                <Translation
                    id="TR_VERSION_HAS_BEEN_RELEASED"
                    values={{
                        version: getVersionName({
                            latestVersion: latest?.version,
                            prerelease: !!latest?.prerelease,
                        }),
                    }}
                />
            </GreenH2>

            <ChangelogWrapper>
                {latest?.changelog ? (
                    <Markdown>{latest?.changelog}</Markdown>
                ) : (
                    <Translation id="TR_COULD_NOT_RETRIEVE_CHANGELOG" />
                )}
            </ChangelogWrapper>
            <StyledLink variant="nostyle" href={getReleaseUrl(latest?.version ?? '')}>
                <Button variant="tertiary" icon="github">
                    <Translation id="TR_CHANGELOG_ON_GITHUB" />
                </Button>
            </StyledLink>
        </StyledModal>
    );
};
