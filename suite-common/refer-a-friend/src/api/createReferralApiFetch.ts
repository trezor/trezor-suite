import { type FetchDep, type Result, err, ok } from '@trezor/type-utils';
import { hasProp } from '@trezor/utils';

import { getReferralAuthorizationHeader } from '../getReferralAuthorizationHeader';
import { type ReferralError } from '../referAFriendTypes';
import { type GetReferAFriendApiUrlDep } from '../referAFriendUrl';
import { type ReferralKey } from '../referralKey';

type PublicRequest = {
    method: 'GET';
    endpoint: 'v1/program';
};

type SignedRequest = {
    method: 'GET' | 'POST';
    endpoint: 'v1/account' | 'v1/account/leave' | 'v1/vouchers';
    referralKey: ReferralKey;
};

export type ReferralApiFetchParams = PublicRequest | SignedRequest;

export type ReferralApiFetch = (
    params: ReferralApiFetchParams,
) => Promise<Result<unknown, ReferralError>>;

export type ReferralApiFetchDep = {
    referralApiFetch: ReferralApiFetch;
};

export type ReferralApiFetchDeps = GetReferAFriendApiUrlDep & FetchDep;

const getErrorCode = async (response: Response): Promise<string | undefined> => {
    try {
        const body: unknown = await response.json();

        return hasProp(body, 'error') && typeof body.error === 'string' ? body.error : undefined;
    } catch {
        console.error('Referral API: error response body is not valid JSON');

        return undefined;
    }
};

// A base URL without the trailing slash would drop its last path segment when resolving.
// The URL can be custom set in Debug settings, so we need to be tolerant of both variants.
const getNormalizedBaseUrl = (baseUrl: string) => (baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);

const getNowInSeconds = () => Math.floor(Date.now() / 1000);

export const createReferralApiFetch =
    (deps: ReferralApiFetchDeps): ReferralApiFetch =>
    async params => {
        const body = params.method === 'POST' ? '{}' : '';

        try {
            const url = new URL(
                params.endpoint,
                getNormalizedBaseUrl(deps.getReferAFriendApiUrl()),
            );
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };

            if ('referralKey' in params) {
                headers.Authorization = getReferralAuthorizationHeader({
                    referralKey: params.referralKey,
                    method: params.method,
                    // The signature covers the path relative to the API root, not the URL prefix
                    // the backend is deployed under (e.g. `/api/public/suite`).
                    path: `/${params.endpoint}`,
                    body,
                    timestampSeconds: getNowInSeconds(),
                });
            }

            const response = await deps.fetch(url.toString(), {
                method: params.method,
                headers,
                body: params.method === 'POST' ? body : null,
            });

            if (!response.ok) {
                return err({
                    message: `Request failed with status ${response.status}`,
                    httpStatus: response.status,
                    code: await getErrorCode(response),
                });
            }

            const data: unknown = await response.json();

            return ok(data);
        } catch (error) {
            return err({ message: error.message });
        }
    };
