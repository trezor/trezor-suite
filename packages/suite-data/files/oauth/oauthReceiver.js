/**
 * - Entry for `/static/oauth/oauth_receiver.html` file.
 * - Used to handle OAuth responses from external providers:
 *   - Google implicit flow - hash
 *   - Dropbox authorization code flow - search
 */

const OAUTH_BROADCAST_CHANNEL_NAME = 'trezor-oauth';

const payload = {
    key: 'trezor-oauth',
    hash: window.location.hash,
    search: window.location.search,
};

const channel = new BroadcastChannel(OAUTH_BROADCAST_CHANNEL_NAME);
channel.postMessage(payload);
channel.close();

if (window.opener) {
    window.opener.postMessage(payload, window.location.origin);
}

window.close();
