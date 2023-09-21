import ReactMarkdown from 'react-markdown';

import styled from 'styled-components';

import { Button, H2, variables, Link } from '@trezor/components';
import { desktopApi, UpdateInfo } from '@trezor/suite-desktop-api';

import { Translation, Modal } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { getReleaseUrl } from 'src/services/github';
import { download } from 'src/actions/suite/desktopUpdateActions';

const GreenH2 = styled(H2)`
    text-align: left;
    color: ${({ theme }) => theme.TYPE_GREEN};
`;

const ChangelogWrapper = styled.div`
    margin: 20px 0px;
    background: ${({ theme }) => theme.BG_GREY};
    border-radius: 8px;
    max-height: 400px;
    overflow-y: auto;
    padding: 16px 20px;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    text-align: left;

    h3 {
        margin-bottom: 4px;
        font-size: ${variables.FONT_SIZE.NORMAL};
        font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    }

    ul,
    ol {
        margin-bottom: 10px;
        margin-left: 36px; /* hacky way to add enough indentation so it is rendered right of an emoji in a section heading */
    }

    li + li {
        margin-top: 4px;
    }

    li {
        line-height: 1.57;
    }

    /*
    Styling similar to  Link component.
    It seems overriding via linkReference renderer doesn't work for some reason
    */
    a {
        cursor: pointer;
        text-decoration: underline;
        color: inherit;
        &:visited,
        &:active,
        &:hover {
            text-decoration: underline;
            color: inherit;
        }
    }
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
                    <Button onClick={hideWindow} variant="secondary">
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
                    <ReactMarkdown>{latest?.changelog}</ReactMarkdown>
                ) : (
                    <Translation id="TR_COULD_NOT_RETRIEVE_CHANGELOG" />
                )}
            </ChangelogWrapper>
            <StyledLink variant="nostyle" href={getReleaseUrl(latest?.version ?? '')}>
                <Button variant="tertiary" icon="GITHUB">
                    <Translation id="TR_CHANGELOG_ON_GITHUB" />
                </Button>
            </StyledLink>
        </StyledModal>
    );
};
