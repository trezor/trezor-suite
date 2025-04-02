import * as ERRORS from './errors';

/**
 * list of errors that may originate from the transport layer but are not related to the device interaction
 */
const ERRORS_WITHOUT_DEVICE_INTERACTION = [
    ERRORS.HTTP_ERROR,
    ERRORS.OTHER_CALL_IN_PROGRESS,
    ERRORS.WRONG_ENVIRONMENT,
    ERRORS.NATIVE_INTERFACE_NOT_AVAILABLE,
    ERRORS.ALREADY_LISTENING,
    ERRORS.SESSION_BACKGROUND_TIMEOUT,
    ERRORS.SESSION_NOT_FOUND,
    ERRORS.SESSION_WRONG_PREVIOUS,
];

export const isErrorWithoutDeviceInteraction = (
    error: string,
): error is (typeof ERRORS_WITHOUT_DEVICE_INTERACTION)[number] =>
    ERRORS_WITHOUT_DEVICE_INTERACTION.includes(error as any);
