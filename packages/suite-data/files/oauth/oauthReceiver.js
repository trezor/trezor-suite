/**
 * - Entry for `/static/oauth/oauth_receiver.html` file.
 * - Used to handle OAuth responses from external providers:
 *   - Google implicit flow - hash
 *   - Dropbox authorization code flow - search
 */

const OAUTH_CHANNEL_NAME = 'trezor-oauth';

const channel = new BroadcastChannel(OAUTH_CHANNEL_NAME);
channel.postMessage({
    key: OAUTH_CHANNEL_NAME,
    hash: window.location.hash,
    search: window.location.search,
});
channel.close();

window.close();
