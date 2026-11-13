import { z } from 'zod';

import { safeParseUrl } from '@trezor/utils';

/**
 * Whether the URL parser would read the string as it is written.
 * It silently drops spaces and control characters around a URL, and tabs and newlines anywhere in it.
 */
const isUrlAsWritten = (value: string) =>
    value.charCodeAt(0) > 0x20 &&
    value.charCodeAt(value.length - 1) > 0x20 &&
    !/[\t\n\r]/.test(value);

/**
 * A URL string parsed into a `URL`.
 * Unlike `z.url()`, which trims the string first, it accepts only a string that is a URL as it is.
 */
export const strictUrlSchema = z
    .string()
    .refine(isUrlAsWritten, { message: 'Malformed URL', abort: true })
    .transform((value, context) => {
        const url = safeParseUrl(value);
        if (!url) {
            context.addIssue({ code: 'custom', message: 'Malformed URL' });

            return z.NEVER;
        }

        return url;
    });
