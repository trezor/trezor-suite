/* @flow */
import { defineMessages } from 'react-intl';
import type { Messages } from 'flowtype/npm/react-intl';

const definedMessages: Messages = defineMessages({
    TR_SCAN_QR_CODE: {
        id: 'TR_SCAN_QR_CODE',
        defaultMessage: 'Scan QR code',
        description: 'Title for the Scan QR modal dialog',
    },
    TR_WAITING_FOR_CAMERA: {
        id: 'TR_WAITING_FOR_CAMERA',
        defaultMessage: 'Waiting for camera...',
    },
    TR_OOPS_SOMETHING_WENT_WRONG: {
        id: 'TR_OOPS_SOMETHING_WENT_WRONG',
        defaultMessage: 'Oops! Something went wrong!',
    },
    TR_CAMERA_PERMISSION_DENIED: {
        id: 'TR_CAMERA_PERMISSION_DENIED',
        defaultMessage: 'Permission to access the camera was denied.',
    },
    TR_CAMERA_NOT_RECOGNIZED: {
        id: 'TR_CAMERA_NOT_RECOGNIZED',
        defaultMessage: 'The camera was not recognized.',
    },
    TR_UNKOWN_ERROR_SEE_CONSOLE: {
        id: 'TR_UNKOWN_ERROR_SEE_CONSOLE',
        defaultMessage: 'Unknown error. See console logs for details.',
    },
});

export default definedMessages;