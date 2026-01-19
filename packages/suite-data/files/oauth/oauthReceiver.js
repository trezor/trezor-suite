/**
 * - Entry for `/static/oauth/oauth_receiver.html` file.
 * - Used to handle OAuth responses from external providers:
 *   - Google implicit flow - hash
 *   - Dropbox authorization code flow - search
 */

if (window.opener) {
    window.opener.postMessage(
        {
            key: 'trezor-oauth',
            hash: window.location.hash,
            search: window.location.search,
        },
        window.location.origin,
    );
}

window.close();
