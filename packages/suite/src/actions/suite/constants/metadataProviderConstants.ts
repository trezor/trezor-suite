export const AUTH_WINDOW_TITLE = 'AuthPopup';
export const AUTH_WINDOW_WIDTH = 600;
export const AUTH_WINDOW_HEIGHT = 720;
export const AUTH_WINDOW_PROPS = `width=${AUTH_WINDOW_WIDTH},height=${AUTH_WINDOW_HEIGHT},dialog=yes,dependent=yes,scrollbars=yes,location=yes`;

// used for desktop app when auth-server is running - generate testing credentials for development
export const GOOGLE_CODE_FLOW_CLIENT_ID =
    '705190185912-m4mrh55knjbg6gqhi72fr906a6n0b0u1.apps.googleusercontent.com';

// used in web app or as a fallback from authorization code flow
export const GOOGLE_IMPLICIT_FLOW_CLIENT_ID =
    '705190185912-nejegm4dbdecdaiumncbaa4ulrfnpk82.apps.googleusercontent.com';

// dropbox allows authorization code flow for both web and desktop without client secret
export const DROPBOX_CLIENT_ID = 'wg0yz2pbgjyhoda';

export const DROPBOX_PASSWORDS_CLIENT_ID = 's340kh3l0vla1nv';
