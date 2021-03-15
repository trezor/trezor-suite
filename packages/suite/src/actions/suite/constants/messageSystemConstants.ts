export const FETCH_SUCCESS = '@message-system/fetch-success';
export const FETCH_SUCCESS_UPDATE = '@message-system/fetch-success-update';
export const FETCH_ERROR = '@message-system/fetch-error';

export const SAVE_VALID_MESSAGES = '@message-system/save-valid-messages';
export const DISMISS_MESSAGE = '@message-system/dismiss-message';

// every 6 hours the message system config should be fetched
export const FETCH_INTERVAL = 21600000;
// every 10 minutes the message system fetching interval should be checked
export const FETCH_CHECK_INTERVAL = 600000;

// TODO: change to production URL
export const MESSAGE_SYSTEM_CONFIG_URL =
    'https://satoshilabs-assignment.s3.eu-central-1.amazonaws.com/signature.jws';
