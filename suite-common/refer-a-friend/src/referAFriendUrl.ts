import { isCodesignBuild } from '@trezor/env-utils';
import { TOR_URLS } from '@trezor/urls';
import { isNotNull, urlToOnion } from '@trezor/utils';

import { type ReferAFriendRootState } from './referAFriendSlice';

export type ReferAFriendApiEnvironment = 'local' | 'dev' | 'prod';

type TorVariant = 'clearnet' | 'onion';

type ReferAFriendApiUrlMap = Record<ReferAFriendApiEnvironment, Record<TorVariant, string>>;

export const LOCAL_REFER_A_FRIEND_API_URL = 'http://127.0.0.1:4010/';
export const DEV_REFER_A_FRIEND_API_URL = 'https://dev.trezorio.sldev.cz/api/public/suite/';
export const PRODUCTION_REFER_A_FRIEND_API_URL = 'https://trezor.io/api/public/suite/';

// Onion URLs are available for bith trezor.io and sldev.cz, if they weren't, fallback to clearnet via tor.
const PRODUCTION_REFER_A_FRIEND_API_URL_ONION =
    urlToOnion(PRODUCTION_REFER_A_FRIEND_API_URL, TOR_URLS) ?? PRODUCTION_REFER_A_FRIEND_API_URL;
const DEV_REFER_A_FRIEND_API_URL_ONION =
    urlToOnion(DEV_REFER_A_FRIEND_API_URL, TOR_URLS) ?? DEV_REFER_A_FRIEND_API_URL;

const REFER_A_FRIEND_API_URL: ReferAFriendApiUrlMap = {
    local: {
        clearnet: LOCAL_REFER_A_FRIEND_API_URL,
        onion: LOCAL_REFER_A_FRIEND_API_URL,
    },
    dev: {
        clearnet: DEV_REFER_A_FRIEND_API_URL,
        onion: DEV_REFER_A_FRIEND_API_URL_ONION,
    },
    prod: {
        clearnet: PRODUCTION_REFER_A_FRIEND_API_URL,
        onion: PRODUCTION_REFER_A_FRIEND_API_URL_ONION,
    },
};

export type GetReferAFriendApiUrl = () => string;

export type GetReferAFriendApiUrlDep = {
    getReferAFriendApiUrl: GetReferAFriendApiUrl;
};

type GetReferAFriendApiUrlParams = {
    env: ReferAFriendApiEnvironment;
    isTorEnabled: boolean;
};

export const getReferAFriendApiUrl = ({ env, isTorEnabled }: GetReferAFriendApiUrlParams) =>
    REFER_A_FRIEND_API_URL[env][isTorEnabled ? 'onion' : 'clearnet'];

// TODO: when Access control headers allow it, make production backend default even on local or dev Suite builds.
const getReferAFriendApiDefaultEnvironment = (): ReferAFriendApiEnvironment =>
    isCodesignBuild() ? 'prod' : 'dev';

type GetReferAFriendApiDefaultUrlParams = {
    isTorEnabled: boolean;
};

export const getReferAFriendApiDefaultUrl = ({
    isTorEnabled,
}: GetReferAFriendApiDefaultUrlParams) =>
    getReferAFriendApiUrl({ env: getReferAFriendApiDefaultEnvironment(), isTorEnabled });

export const selectReferAFriendApiCustomUrl = (state: ReferAFriendRootState) => {
    const { baseUrl } = state.referAFriend.settings;

    return isNotNull(baseUrl) && baseUrl.trim() !== '' ? baseUrl : null;
};

export const selectReferAFriendApiUrl = (state: ReferAFriendRootState, isTorEnabled: boolean) =>
    selectReferAFriendApiCustomUrl(state) ?? getReferAFriendApiDefaultUrl({ isTorEnabled });
