/* eslint-disable camelcase */

/**
 * Release
 *
 * Types for responses from:
 * https://docs.github.com/en/rest/reference/repos#releases
 */
export type ReleaseInfo = {
    url: string;
    assets_url: string;
    upload_url: string;
    html_url: string;
    id: number;
    author: ReleaseUser;
    node_id: string;
    tag_name: string;
    target_commitish: string;
    name: string;
    draft: boolean;
    prerelease: boolean;
    created_at: string;
    published_at: string;
    assets: ReleaseAsset[];
    tarball_url: string;
    zipball_url: string;
    body: string;
};

export type ReleaseAsset = {
    url: string;
    id: number;
    node_id: string;
    name: string;
    label: string | null;
    uploader: ReleaseUser;
    content_type: string;
    state: string;
    size: number;
    download_count: number;
    created_at: string;
    updated_at: string;
    browser_download_url: string;
};

export type ReleaseUser = {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
};
