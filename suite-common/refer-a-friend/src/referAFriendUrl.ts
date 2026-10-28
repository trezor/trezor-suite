import { isCodesignBuild } from '@trezor/env-utils';
import { TOR_URLS } from '@trezor/urls';
import { isNotNull, urlToOnion } from '@trezor/utils';

import { type ReferAFriendRootState } from './referAFriendSlice';

export type ReferAFriendApiEnvironment = 'local' | 'prod';

type TorVariant = 'clearnet' | 'onion';

type ReferAFriendApiUrlMap = Record<ReferAFriendApiEnvironment, Record<TorVariant, string>>;

export const LOCAL_REFER_A_FRIEND_API_URL = 'http://127.0.0.1:4010/';

// TODO: Replace with the production backend once it exists.
const PRODUCTION_REFER_A_FRIEND_API_URL = 'https://trezor.io/api/refer-a-friend/';

const PRODUCTION_REFER_A_FRIEND_API_URL_ONION =
    urlToOnion(PRODUCTION_REFER_A_FRIEND_API_URL, TOR_URLS) ?? PRODUCTION_REFER_A_FRIEND_API_URL;

const REFER_A_FRIEND_API_URL: ReferAFriendApiUrlMap = {
    local: {
        clearnet: LOCAL_REFER_A_FRIEND_API_URL,
        onion: LOCAL_REFER_A_FRIEND_API_URL,
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

const getReferAFriendApiDefaultEnvironment = (): ReferAFriendApiEnvironment =>
    isCodesignBuild() ? 'prod' : 'local';

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
