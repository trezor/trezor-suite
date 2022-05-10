import { getWeakRandomId } from '@trezor/utils';

export const getTrackingRandomId = () => getWeakRandomId(10);

/**
 * Generate code_challenge for Oauth2
 * Authorization code with PKCE flow
 */
export const getCodeChallenge = () => getWeakRandomId(128);
