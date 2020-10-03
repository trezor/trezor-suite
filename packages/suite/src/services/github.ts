const REPO_INFO = {
    owner: 'trezor',
    repo: 'trezor-suite',
};

const RELEASE_URL = `https://github.com/${REPO_INFO.owner}/${REPO_INFO.repo}`;

export const getReleaseNotes = async (version: string) => {
    const url = `https://api.github.com/repos/${REPO_INFO.owner}/${REPO_INFO.repo}/releases/tags/v${version}`;
    const response = await fetch(url);
    const release = response.json();

    return release;
};

export const getReleaseUrl = (version: string) => `${RELEASE_URL}/releases/tag/v${version}`;
