import type { MessageSystem } from '@suite-common/suite-types';
import { decodeJws, verifyJws } from '@suite-common/suite-utils';
import { scheduleAction } from '@trezor/utils';

import { CONFIG_URL_REMOTE, FETCH_TIMEOUT_IN_MS, JWS_SIGN_ALGORITHM, VERSION } from './constants';

export const getRemoteConfigUrl = (isCodesignBuild: boolean) =>
    isCodesignBuild ? CONFIG_URL_REMOTE.stable : CONFIG_URL_REMOTE.develop;

/**
 * Downloads a JWS config. The caller is responsible for making the request go through the Tor
 * proxy where that applies, because this is a plain `fetch` call.
 */
export const fetchRemoteConfigJws = async (url: string, timeout = FETCH_TIMEOUT_IN_MS) => {
    const response = await scheduleAction(signal => fetch(url, { signal }), { timeout });

    if (!response.ok) {
        throw Error(response.statusText);
    }

    return response.text();
};

/**
 * Decodes a JWS config, checks its signing algorithm, verifies its authenticity against the
 * bundled public key and returns the payload. Throws on any failure, so an unverified config can
 * never reach condition evaluation.
 */
export const verifyConfigJws = (configJws: string): MessageSystem => {
    const decodedJws = decodeJws(configJws);

    if (!decodedJws) {
        throw Error('Decoding of config failed');
    }

    const algorithmInHeader = decodedJws.header.alg;
    if (algorithmInHeader !== JWS_SIGN_ALGORITHM) {
        throw Error(`Wrong algorithm in JWS config header: ${algorithmInHeader}`);
    }

    const isAuthenticityValid = verifyJws(configJws, JWS_SIGN_ALGORITHM);

    if (!isAuthenticityValid) {
        throw Error('Config authenticity is invalid');
    }

    const config: MessageSystem = JSON.parse(decodedJws.payload);

    if (VERSION !== config.version) {
        throw Error('Config version is not supported');
    }

    return config;
};

export type ConfigSequenceComparison = 'newer' | 'same' | 'older';

/**
 * An acquired config must never roll the sequence back: accepting a lower sequence would let an
 * attacker replace a live config with an older, already published one.
 */
export const compareConfigSequence = (
    currentSequence: number,
    acquiredSequence: number,
): ConfigSequenceComparison => {
    if (currentSequence < acquiredSequence) {
        return 'newer';
    }

    if (currentSequence === acquiredSequence) {
        return 'same';
    }

    return 'older';
};
