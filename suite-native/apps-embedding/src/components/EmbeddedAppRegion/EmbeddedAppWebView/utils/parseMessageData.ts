import { parseJSON } from '@trezor/utils';

/**
 * The React Native bridge carries strings only. A page posting JSON is logged by the parsed value,
 * as the web host logs a structured-cloned message, and anything else as the string it sent.
 */
export const parseMessageData = (data: string): unknown => {
    const parsedData = parseJSON(data);

    return parsedData === undefined ? data : parsedData;
};
