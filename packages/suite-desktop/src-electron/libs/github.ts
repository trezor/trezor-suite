import type { GithubReleaseInfo } from '@suite-common/suite-types';
import { GITHUB_REPO_URL, GITHUB_API_REPO_URL } from '@trezor/urls';

export const getReleaseNotes = async (version?: string) => {
    if (!version) {
        return;
    }

    const url = `${GITHUB_API_REPO_URL}/releases/tags/v${version}`;
    const response = await fetch(url);
    const release = await response.json();

    return release as GithubReleaseInfo;
};

export const getSignatureFileURL = (filename: string, version?: string) =>
    `${GITHUB_REPO_URL}/releases/download/v${version}/${filename}.asc`;
