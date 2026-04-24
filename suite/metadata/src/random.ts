import { getRandomString } from '@trezor/utils';

/**
 * Generate a cryptographically strong `code_challenge` for the OAuth2 PKCE
 * flow. RFC 7636 requires a cryptographically random string.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7636#section-4.1
 */
export const getCodeChallenge = () => getRandomString(128);
