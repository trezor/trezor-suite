import { type FetchDep, type Result, err, ok } from '@trezor/type-utils';
import { hasProp } from '@trezor/utils';

import { getReferralAuthorizationHeader } from '../getReferralAuthorizationHeader';
import { type ReferralApiErrorCode, type ReferralRequestError } from '../referAFriendTypes';
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
) => Promise<Result<unknown, ReferralRequestError>>;

export type ReferralApiFetchDep = {
    referralApiFetch: ReferralApiFetch;
};

export type ReferralApiFetchDeps = GetReferAFriendApiUrlDep & FetchDep;

const referralApiErrorCodes: ReferralApiErrorCode[] = [
    'badRequest',
    'signatureInvalid',
    'timestampExpired',
    'accountRequired',
    'rateLimited',
];

const isReferralApiErrorCode = (value: unknown): value is ReferralApiErrorCode =>
    referralApiErrorCodes.some(code => code === value);

const getErrorCode = async (response: Response): Promise<ReferralApiErrorCode | null> => {
    try {
        const body: unknown = await response.json();

        return hasProp(body, 'error') && isReferralApiErrorCode(body.error) ? body.error : null;
    } catch {
        return null;
    }
};

// A base URL without the trailing slash would drop its last path segment when resolving.
const getNormalizedBaseUrl = (baseUrl: string) => (baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);

const getNowInSeconds = () => Math.floor(Date.now() / 1000);

export const createReferralApiFetch =
    (deps: ReferralApiFetchDeps): ReferralApiFetch =>
    async params => {
        const body = params.method === 'POST' ? '{}' : '';

        try {
            // Can throw for an invalid custom URL, so it needs to be in the try block.
            const url = new URL(
                params.endpoint,
                getNormalizedBaseUrl(deps.getReferAFriendApiUrl()),
            );
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };

            if ('referralKey' in params) {
                headers.Authorization = getReferralAuthorizationHeader({
                    referralKey: params.referralKey,
                    method: params.method,
                    // The signature covers the path without host and query.
                    path: url.pathname,
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
                    type: 'ApiError',
                    code: await getErrorCode(response),
                    httpStatus: response.status,
                });
            }

            const data: unknown = await response.json();

            return ok(data);
        } catch (error) {
            return err({ type: 'FetchError', message: error.message });
        }
    };
